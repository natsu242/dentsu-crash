const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
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

  // ── Clean number: digits only, no + or spaces ─────────────────────────────
  const cleanNumber = phoneNumber ? phoneNumber.replace(/\D/g, '') : null;

  // ── Determine if we need pairing (fresh, unregistered session) ────────────
  const needsPairing = !!(cleanNumber && !state.creds.registered);

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal : false,
    auth: {
      creds : state.creds,
      keys  : makeCacheableSignalKeyStore(state.keys, logger),
    },
    // Fingerprint — avoids common WA blocking patterns
    browser                       : ['DENTSU CRASH', 'Safari', '3.0'],
    generateHighQualityLinkPreview: true,
    connectTimeoutMs              : 60_000,
    defaultQueryTimeoutMs         : 60_000,
    keepAliveIntervalMs           : 10_000,
    syncFullHistory               : false,
    markOnlineOnConnect           : false,
    // NOTE: fireInitQueries must remain true (default) so WA servers
    // properly process the pairing request. Setting it to false breaks pairing.
  });

  store.bind(sock.ev);
  sessions.set(sessionId, { sock, store, status: 'connecting', code: null });

  // ── REQUEST PAIRING CODE ───────────────────────────────────────────────────
  // Call requestPairingCode() directly after makeWASocket().
  // Baileys 6.x handles the WS handshake timing internally — no polling or
  // setTimeout needed. The function is async and resolves once WA servers
  // confirm the pairing request.
  if (needsPairing) {
    (async () => {
      try {
        const raw       = await sock.requestPairingCode(cleanNumber);
        const formatted = raw.match(/.{1,4}/g).join('-');   // ABCD-1234

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
    })();
  }

  // ── Connection events ─────────────────────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !needsPairing) {
      // QR mode (restore without phone number) — just log, don't display
      console.log(`[QR] Session ${sessionId} — QR generated (restore mode)`);
    }

    if (connection === 'close') {
      const statusCode      = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[CONN] Session ${sessionId} closed — code ${statusCode}, reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        const s = sessions.get(sessionId);
        if (s) s.status = 'reconnecting';
        await sleep(3000);
        // Only auto-reconnect for restored sessions (no pairing number)
        if (!phoneNumber) createSession(sessionId, io, null);
      } else {
        sessions.delete(sessionId);
        if (io) io.emit('sessions_update', getSessionsInfo());
      }
    }

    if (connection === 'open') {
      const s = sessions.get(sessionId);
      if (s) {
        s.status = 'connected';
        s.code   = null;
        sessions.set(sessionId, s);
      }
      console.log(`[CONN] Session ${sessionId} — connected as ${sock.user?.id}`);
      if (io) io.emit('sessions_update', getSessionsInfo());

      // Send welcome message to owner when a new session comes online
      try {
        const { sendWelcomeMessage } = require('../handler');
        await sendWelcomeMessage(sock, config.ownerNumber);
      } catch (_) {}
    }
  });

  // ── Credentials persistence ───────────────────────────────────────────────
  sock.ev.on('creds.update', saveCreds);

  // ── Messages ──────────────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    try {
      const { handleMessage } = require('../handler');
      for (const msg of messages) {
        if (!msg.key.fromMe) await handleMessage(sock, msg);
      }
    } catch (err) {
      console.error('[MSG ERROR]', err.message);
    }
  });

  return { sessionId };
}

// ── requestPairing: kept for backward compat ──────────────────────────────────
async function requestPairing(sessionId, phoneNumber, io) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  const clean     = phoneNumber.replace(/\D/g, '');
  const raw       = await session.sock.requestPairingCode(clean);
  const formatted = raw.match(/.{1,4}/g).join('-');
  session.code   = formatted;
  session.status = 'pairing';
  sessions.set(sessionId, session);
  if (io) io.emit('pairing_code', { sessionId, code: formatted });
  return formatted;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getSession(sessionId)  { return sessions.get(sessionId) || null; }
function getAllSessions()        { return sessions; }
function getSessionCount()      { return sessions.size; }

function getSessionsInfo() {
  const info = [];
  for (const [id, data] of sessions) {
    info.push({
      sessionId: id,
      status   : data.status,
      code     : data.code || null,
      user     : data.sock?.user || null,
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

// ── Delete ALL sessions + wipe disk ──────────────────────────────────────────
async function deleteAllSessions() {
  for (const [id] of sessions) {
    await deleteSession(id);
  }
  // Also wipe any orphan folders
  await fs.emptyDir(config.sessionDir);
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
  deleteAllSessions,
  getSessionCount,
  restoreAllSessions,
};
