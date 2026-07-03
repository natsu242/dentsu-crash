const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  Browsers,
} = require('@whiskeysockets/baileys');
const pino   = require('pino');
const path   = require('path');
const fs     = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const logger   = pino({ level: 'silent' });
const sessions = new Map();
const MAX_SESSIONS = config.maxSessions || 60;

// ─── Create session ────────────────────────────────────────────────────────────
// phoneNumber: "242053323191" → pairing code mode
// null/undefined              → restore from saved creds (no code)
async function createSession(sessionId = null, io = null, phoneNumber = null) {
  if (!sessionId) sessionId = uuidv4();
  if (sessions.size >= MAX_SESSIONS) throw new Error(`Session limit of ${MAX_SESSIONS} reached.`);
  if (sessions.has(sessionId))       return { sessionId, existing: true };

  const sessionPath = path.join(config.sessionDir, sessionId);
  await fs.ensureDir(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version }          = await fetchLatestBaileysVersion();
  const store                = makeInMemoryStore({ logger });

  // ── Clean number: digits only, no + ──────────────────────────────────────
  const cleanNumber = phoneNumber ? phoneNumber.replace(/\D/g, '') : null;

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal : false,
    auth: {
      creds : state.creds,
      keys  : makeCacheableSignalKeyStore(state.keys, logger),
    },
    // Browser fingerprint — Mac + Safari avoids some WA blocking patterns
    browser                  : ['DENTSU CRASH', 'Safari', '3.0'],
    generateHighQualityLinkPreview: true,
    connectTimeoutMs         : 60_000,
    defaultQueryTimeoutMs    : 60_000,
    keepAliveIntervalMs      : 10_000,   // ping WA every 10 s (prevent drop)
    syncFullHistory          : false,
    markOnlineOnConnect      : false,
    fireInitQueries          : false,
  });

  store.bind(sock.ev);
  sessions.set(sessionId, { sock, store, status: 'connecting', code: null });

  // ── REQUEST PAIRING CODE — immediately, before QR fires ───────────────────
  // In Baileys 6.x this MUST be called right after socket creation when
  // the creds are not yet registered. Waiting for the QR event is unreliable.
  if (cleanNumber && !state.creds.registered) {
    // Give the WebSocket a moment to open its connection to WA servers
    setTimeout(async () => {
      try {
        const raw       = await sock.requestPairingCode(cleanNumber);
        // Insert dash every 4 chars: "ABCD1234" → "ABCD-1234"
        const formatted = raw.match(/.{1,4}/g).join('-');
        const sessionData = sessions.get(sessionId);
        if (sessionData) {
          sessionData.code   = formatted;
          sessionData.status = 'pairing';
          sessions.set(sessionId, sessionData);
        }
        if (io) {
          io.emit('pairing_code',    { sessionId, code: formatted });
          io.emit('sessions_update', getSessionsInfo());
        }
        console.log(`[PAIR] ${sessionId} → code: ${formatted}`);
      } catch (err) {
        console.error(`[PAIR ERROR] ${err.message}`);
        if (io) io.emit('pair_error', { sessionId, message: `Failed to get pairing code: ${err.message}` });
      }
    }, 3000); // 3 s — enough for the WS handshake with WA servers
  }

  // ── Connection events ─────────────────────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const statusCode    = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[SESSION] ${sessionId} closed. Code=${statusCode} Reconnect=${shouldReconnect}`);

      sessions.delete(sessionId);
      if (io) io.emit('sessions_update', getSessionsInfo());

      if (shouldReconnect) {
        // Reconnect from saved creds — do NOT request new pairing code
        console.log(`[SESSION] Reconnecting ${sessionId} in 5 s…`);
        setTimeout(() => createSession(sessionId, io, null), 5000);
      }
    }

    if (connection === 'open') {
      const sessionData = sessions.get(sessionId);
      if (sessionData) {
        sessionData.status = 'connected';
        sessionData.code   = null;
        sessions.set(sessionId, sessionData);
      }
      if (io) {
        io.emit('connected',       { sessionId });
        io.emit('sessions_update', getSessionsInfo());
      }
      console.log(`[SESSION] ${sessionId} CONNECTED ✅`);

      // Send welcome to owner
      try {
        const { sendWelcomeMessage } = require('../handler');
        const ownerJid = config.ownerNumber + '@s.whatsapp.net';
        await sendWelcomeMessage(sock, ownerJid);
      } catch (e) {
        console.error('[WELCOME ERROR]', e.message);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ── Messages ──────────────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      try {
        const { handleMessage } = require('../handler');
        await handleMessage(sock, msg);
      } catch (e) {
        console.error('[MESSAGE ERROR]', e.message);
      }
    }
  });

  return { sessionId };
}

// ─── Legacy alias ─────────────────────────────────────────────────────────────
async function requestPairing(sessionId, phoneNumber) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found.');
  const clean     = phoneNumber.replace(/\D/g, '');
  const raw       = await session.sock.requestPairingCode(clean);
  return raw.match(/.{1,4}/g).join('-');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSession(sessionId) { return sessions.get(sessionId) || null; }
function getAllSessions()       { return sessions; }
function getSessionCount()     { return sessions.size; }

function getSessionsInfo() {
  const info = [];
  for (const [id, data] of sessions.entries()) {
    info.push({
      id,
      status : data.status,
      code   : data.code || null,
      user   : data.sock?.user || null,
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

// ─── Restore saved sessions on startup ────────────────────────────────────────
async function restoreAllSessions(io) {
  await fs.ensureDir(config.sessionDir);
  const entries = await fs.readdir(config.sessionDir);
  const dirs    = [];
  for (const entry of entries) {
    const full = path.join(config.sessionDir, entry);
    const stat = await fs.stat(full);
    if (stat.isDirectory()) dirs.push(entry);
  }
  console.log(`[SESSIONS] Restoring ${dirs.length} session(s)…`);
  for (const sessionId of dirs) {
    try {
      await createSession(sessionId, io, null);
      console.log(`[RESTORE] ✅ ${sessionId}`);
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
