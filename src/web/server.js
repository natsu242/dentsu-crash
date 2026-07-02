const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path   = require('path');
const config = require('../config');
const {
  createSession, getSessionsInfo, deleteSession,
  getSessionCount,
} = require('../lib/session-manager');

async function startWebServer() {
  const app    = express();
  const server = http.createServer(app);
  const io     = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // ─── REST API ─────────────────────────────────────────────────────────────

  app.get('/api/info', (_, res) => res.json({
    botName: config.botName,
    version: config.version,
    dev: config.dev,
    ownerName: config.ownerName,
    ownerNumber: config.ownerNumber,
    maxSessions: config.maxSessions,
    activeSessions: getSessionCount(),
  }));

  app.get('/api/sessions', (_, res) => res.json({ sessions: getSessionsInfo() }));

  // POST /api/sessions/pair — start pairing with a phone number
  app.post('/api/sessions/pair', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber is required.' });
    if (getSessionCount() >= config.maxSessions)
      return res.status(429).json({ error: `Session limit of ${config.maxSessions} reached.` });
    try {
      const { sessionId } = await createSession(null, io, phoneNumber);
      res.json({ success: true, sessionId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/sessions/:id', async (req, res) => {
    try {
      await deleteSession(req.params.id);
      io.emit('sessions_update', getSessionsInfo());
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/', (_, res) =>
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  );

  // ─── Socket.IO ────────────────────────────────────────────────────────────

  io.on('connection', (socket) => {
    console.log(`[WEB] Client connected: ${socket.id}`);

    socket.emit('sessions_update', getSessionsInfo());
    socket.emit('bot_info', {
      botName: config.botName,
      version: config.version,
      dev: config.dev,
      maxSessions: config.maxSessions,
    });

    // User submits phone number → create session with pairing code
    socket.on('pair_request', async ({ phoneNumber }) => {
      if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 7) {
        socket.emit('error', { message: 'Please enter a valid phone number.' });
        return;
      }
      if (getSessionCount() >= config.maxSessions) {
        socket.emit('error', { message: `Session limit of ${config.maxSessions} reached.` });
        return;
      }
      try {
        const clean = phoneNumber.replace(/\D/g, '');
        const { sessionId } = await createSession(null, io, clean);
        socket.emit('pair_started', { sessionId });
        console.log(`[PAIR] Started pairing for +${clean} — session ${sessionId}`);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Delete session
    socket.on('delete_session', async ({ sessionId }) => {
      try {
        await deleteSession(sessionId);
        io.emit('sessions_update', getSessionsInfo());
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WEB] Client disconnected: ${socket.id}`);
    });
  });

  // ─── Start ────────────────────────────────────────────────────────────────
  return new Promise((resolve, reject) => {
    server.listen(config.webPort, () => {
      console.log(`[WEB] Panel running on port ${config.webPort}`);
      resolve({ io, server });
    });
    server.on('error', reject);
  });
}

module.exports = { startWebServer };
