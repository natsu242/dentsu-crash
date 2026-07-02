const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const config = require('../config');
const { createSession, getSessionsInfo, deleteSession, getSessionCount } = require('../lib/session-manager');

async function startWebServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // ─── API Routes ────────────────────────────────

  // Info bot
  app.get('/api/info', (req, res) => {
    res.json({
      botName: config.botName,
      version: config.version,
      dev: config.dev,
      ownerName: config.ownerName,
      ownerNumber: config.ownerNumber,
      maxSessions: config.maxSessions,
      activeSessions: getSessionCount(),
    });
  });

  // Liste des sessions
  app.get('/api/sessions', (req, res) => {
    res.json({ sessions: getSessionsInfo() });
  });

  // Créer une nouvelle session
  app.post('/api/sessions/create', async (req, res) => {
    try {
      if (getSessionCount() >= config.maxSessions) {
        return res.status(429).json({ error: `Limite de ${config.maxSessions} sessions atteinte.` });
      }
      const { sessionId } = await createSession(null, io);
      res.json({ success: true, sessionId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Supprimer une session
  app.delete('/api/sessions/:id', async (req, res) => {
    try {
      await deleteSession(req.params.id);
      io.emit('sessions_update', getSessionsInfo());
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // QR code d'une session
  app.get('/api/sessions/:id/qr', (req, res) => {
    const { getAllSessions } = require('../lib/session-manager');
    const sessions = getAllSessions();
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session introuvable.' });
    if (!session.qr) return res.status(204).json({ message: 'Pas de QR disponible.' });
    res.json({ qr: session.qr });
  });

  // Page principale
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // ─── Socket.IO ─────────────────────────────────

  io.on('connection', (socket) => {
    console.log(`[WEB] Client connecté: ${socket.id}`);

    // Envoyer l'état actuel
    socket.emit('sessions_update', getSessionsInfo());
    socket.emit('bot_info', {
      botName: config.botName,
      version: config.version,
      dev: config.dev,
      maxSessions: config.maxSessions,
    });

    // Rejoindre la salle d'une session pour recevoir son QR
    socket.on('join_session', (sessionId) => {
      socket.join(sessionId);
      const { getAllSessions } = require('../lib/session-manager');
      const sessions = getAllSessions();
      const session = sessions.get(sessionId);
      if (session?.qr) {
        socket.emit('qr', { sessionId, qr: session.qr });
      }
    });

    // Créer une nouvelle session depuis le web
    socket.on('create_session', async () => {
      try {
        if (getSessionCount() >= config.maxSessions) {
          socket.emit('error', { message: `Limite de ${config.maxSessions} sessions atteinte.` });
          return;
        }
        const { sessionId } = await createSession(null, io);
        socket.emit('session_created', { sessionId });
        socket.join(sessionId);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Supprimer une session depuis le web
    socket.on('delete_session', async ({ sessionId }) => {
      try {
        await deleteSession(sessionId);
        io.emit('sessions_update', getSessionsInfo());
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WEB] Client déconnecté: ${socket.id}`);
    });
  });

  // ─── Démarrage ─────────────────────────────────

  return new Promise((resolve, reject) => {
    server.listen(config.webPort, () => {
      resolve({ io, server });
    });
    server.on('error', reject);
  });
}

module.exports = { startWebServer };
