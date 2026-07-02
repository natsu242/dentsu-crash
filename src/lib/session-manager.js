const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  Browsers,
} = require('@whiskeysockets/baileys');
const pino  = require('pino');
const path  = require('path');
const fs    = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const logger = pino({ level: 'silent' });
const sessions = new Map();
const MAX_SESSIONS = config.maxSessions || 60;

// ─── Create session (pairing-code mode) ───────────────────────────────────────
// phoneNumber: e.g. "242053323191"  — if provided, requests pairing code
//              null/undefined       — connection from restored creds (no code needed)
async function createSession(sessionId = null, io = null, phoneNumber = null) {
  if (!sessionId) sessionId = uuidv4();
  if (sessions.size >= MAX_SESSIONS) {
    throw new Error(`Session limit of ${MAX_SESSIONS} reached.`);
  }
  if (sessions.has(sessionId)) {
    return { sessionId, existing: true };
  }

  const sessionPath = path.join(config.sessionDir, sessionId);
  await fs.ensureDir(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();
  const store = makeInMemoryStore({ logger });

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,    // no QR in terminal
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: Browsers.ubuntu('Chrome'),
    generateHighQualityLinkPreview: true,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 30_000,
    keepAliveIntervalMs: 25_000,
  });

  store.bind(sock.ev);
  sessions.set(sessionId, { sock, store, status: 'connecting', code: null });

  let pairingCodeRequested = false;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // ── Pairing code: intercept QR event ───────────────────────────────────
    if (qr && phoneNumber && !pairingCodeRequested) {
      pairingCodeRequested = true;
      try {
        const code = await sock.requestPairingCode(phoneNumber.replace(/\D/g, ''));
        const formatted = code.match(/.{1,4}/g).join('-'); // e.g. "ABCD-1234"
        const sessionData = sessions.get(sessionId);
        if (sessionData) {
          sessionData.code = formatted;
          sessionData.status = 'pairing';
          sessions.set(sessionId, sessionData);
        }
        if (io) {
          io.emit('pairing_code', { sessionId, code: formatted });
          io.emit('sessions_update', getSessionsInfo());
        }
        console.log(`[PAIR] Session ${sessionId} — Code: ${formatted}`);
      } catch (err) {
        console.error(`[PAIR ERROR] ${err.message}`);
        if (io) io.emit('pair_error', { sessionId, message: err.message });
      }
    }

    // ── Disconnected ────────────────────────────────────────────────────────
    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`[SESSION] ${sessionId} disconnected. Reconnect: ${shouldReconnect}`);
      sessions.delete(sessionId); // remove before recreating
      if (io) io.emit('sessions_update', getSessionsInfo());

      if (shouldReconnect) {
        // Reconnect without requesting a new code (creds still valid)
        setTimeout(() => createSession(sessionId, io, null), 5000);
      }
    }

    // ── Connected ───────────────────────────────────────────────────────────
    if (connection === 'open') {
      const sessionData = sessions.get(sessionId);
      if (sessionData) {
        sessionData.status = 'connected';
        sessionData.code = null;
        sessions.set(sessionId, sessionData);
      }
      if (io) {
        io.emit('connected', { sessionId });
        io.emit('sessions_update', getSessionsInfo());
      }
      console.log(`[SESSION] ${sessionId} connected ✅`);

      // Send welcome message to owner on first connection
      try {
        const { sendWelcomeMessage } = require('../handler');
        const ownerJid = config.ownerNumber + '@s.whatsapp.net';
        await sendWelcomeMessage(sock, ownerJid);
      } catch (_) {}
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ── Attach message handler ─────────────────────────────────────────────────
  const { handleMessage } = require('../handler');
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message) continue;
      try {
        await handleMessage(sock, msg, store);
      } catch (err) {
        console.error(`[HANDLER ERROR] ${err.message}`);
      }
    }
  });

  return { sessionId, sock };
}

// ─── Request pairing code for an existing session ─────────────────────────────
// Called from web server when user submits phone number
async function requestPairing(sessionId, phoneNumber, io) {
  return createSession(sessionId, io, phoneNumber);
}

function getSession(sessionId) { return sessions.get(sessionId); }
function getAllSessions()       { return sessions; }
function getSessionCount()     { return sessions.size; }

function getSessionsInfo() {
  const info = [];
  for (const [id, data] of sessions) {
    info.push({
      id,
      status: data.status,
      code: data.code || null,
      user: data.sock?.user || null,
    });
  }
  return info;
}

async function deleteSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    try { await session.sock.logout(); } catch (_) {}
    sessions.delete(sessionId);
  }
  const sessionPath = path.join(config.sessionDir, sessionId);
  await fs.remove(sessionPath);
  return true;
}

// ─── Restore all saved sessions on startup ────────────────────────────────────
async function restoreAllSessions(io) {
  await fs.ensureDir(config.sessionDir);
  const entries = await fs.readdir(config.sessionDir);
  const dirs = [];
  for (const entry of entries) {
    const full = path.join(config.sessionDir, entry);
    const stat = await fs.stat(full);
    if (stat.isDirectory()) dirs.push(entry);
  }
  console.log(`[SESSIONS] Restoring ${dirs.length} saved session(s)...`);
  for (const sessionId of dirs) {
    try {
      await createSession(sessionId, io, null); // restore without pairing code
      console.log(`[RESTORE] Session ${sessionId} restored`);
    } catch (err) {
      console.error(`[RESTORE ERROR] ${sessionId}: ${err.message}`);
    }
  }
}

module.exports = {
  createSession,
  requestPairing,
  getSession,
  getAllSessions,
  getSessionsInfo,
  deleteSession,
  getSessionCount,
  restoreAllSessions,
};
