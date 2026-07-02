const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  Browsers,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const logger = pino({ level: 'silent' });
const sessions = new Map();
const sessionEvents = new Map();

// Max 60 sessions simultanées
const MAX_SESSIONS = config.maxSessions || 60;

async function createSession(sessionId = null, io = null) {
  if (!sessionId) sessionId = uuidv4();
  if (sessions.size >= MAX_SESSIONS) {
    throw new Error(`Limite de ${MAX_SESSIONS} sessions atteinte.`);
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
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: Browsers.ubuntu('Chrome'),
    generateHighQualityLinkPreview: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 30000,
    keepAliveIntervalMs: 25000,
  });

  store.bind(sock.ev);

  sessions.set(sessionId, { sock, store, status: 'connecting', qr: null });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const QRCode = require('qrcode');
      const qrImage = await QRCode.toDataURL(qr);
      const sessionData = sessions.get(sessionId);
      if (sessionData) {
        sessionData.qr = qrImage;
        sessionData.status = 'qr';
        sessions.set(sessionId, sessionData);
      }
      if (io) {
        io.to(sessionId).emit('qr', { sessionId, qr: qrImage });
        io.emit('sessions_update', getSessionsInfo());
      }
      console.log(`[QR] Session ${sessionId} — Scanner le QR code`);
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      const sessionData = sessions.get(sessionId);
      if (sessionData) {
        sessionData.status = 'disconnected';
        sessions.set(sessionId, sessionData);
      }
      if (io) io.emit('sessions_update', getSessionsInfo());
      console.log(`[SESSION] ${sessionId} déconnecté. Reconnexion: ${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(() => createSession(sessionId, io), 5000);
      } else {
        sessions.delete(sessionId);
        if (io) io.emit('sessions_update', getSessionsInfo());
      }
    }

    if (connection === 'open') {
      const sessionData = sessions.get(sessionId);
      if (sessionData) {
        sessionData.status = 'connected';
        sessionData.qr = null;
        sessions.set(sessionId, sessionData);
      }
      if (io) {
        io.to(sessionId).emit('connected', { sessionId });
        io.emit('sessions_update', getSessionsInfo());
      }
      console.log(`[SESSION] ${sessionId} connecté avec succès ✅`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Attacher le handler de messages
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

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function getAllSessions() {
  return sessions;
}

function getSessionsInfo() {
  const info = [];
  for (const [id, data] of sessions) {
    info.push({
      id,
      status: data.status,
      hasQr: !!data.qr,
      user: data.sock?.user || null,
    });
  }
  return info;
}

async function deleteSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    try {
      await session.sock.logout();
    } catch (_) {}
    sessions.delete(sessionId);
  }
  const sessionPath = path.join(config.sessionDir, sessionId);
  await fs.remove(sessionPath);
  return true;
}

function getSessionCount() {
  return sessions.size;
}

module.exports = {
  createSession,
  getSession,
  getAllSessions,
  getSessionsInfo,
  deleteSession,
  getSessionCount,
};
