// DENTSU CRASH v4.9.0 — Frontend Panel
const socket = io();

// ── State ──────────────────────────────────────
let currentSessionId = null;
let sessions = [];

// ── Init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  setupEventListeners();
});

// ── Particles ──────────────────────────────────
function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      animation-duration: ${Math.random() * 15 + 10}s;
      animation-delay: ${Math.random() * 15}s;
      opacity: ${Math.random() * 0.5 + 0.1};
    `;
    container.appendChild(p);
  }
}

// ── Socket Events ──────────────────────────────
socket.on('connect', () => {
  setStatus('online');
  showToast('✅ Connecté au serveur', 'success');
});

socket.on('disconnect', () => {
  setStatus('offline');
  showToast('❌ Déconnecté du serveur', 'error');
});

socket.on('bot_info', (info) => {
  document.getElementById('max-sessions').textContent = info.maxSessions;
});

socket.on('sessions_update', (data) => {
  sessions = Array.isArray(data) ? data : [];
  updateSessionsUI();
  updateStats();
});

socket.on('session_created', ({ sessionId }) => {
  currentSessionId = sessionId;
  socket.emit('join_session', sessionId);
  showQrModal(sessionId);
  showToast('📱 Session créée — Scanner le QR code', 'success');
});

socket.on('qr', ({ sessionId, qr }) => {
  if (sessionId === currentSessionId || document.getElementById('qr-modal').style.display !== 'none') {
    displayQr(qr, sessionId);
  }
});

socket.on('connected', ({ sessionId }) => {
  if (sessionId === currentSessionId) {
    closeQrModal();
    showToast('✅ WhatsApp connecté avec succès !', 'success');
  }
});

socket.on('error', ({ message }) => {
  showToast(`❌ ${message}`, 'error');
});

// ── Event Listeners ────────────────────────────
function setupEventListeners() {
  document.getElementById('btn-add-session').addEventListener('click', () => {
    socket.emit('create_session');
    showToast('⏳ Création de la session...', 'success');
  });

  document.getElementById('modal-close').addEventListener('click', closeQrModal);

  document.getElementById('qr-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeQrModal();
  });
}

// ── Sessions UI ────────────────────────────────
function updateSessionsUI() {
  const grid = document.getElementById('sessions-grid');
  const emptyState = document.getElementById('empty-state');

  if (sessions.length === 0) {
    grid.innerHTML = '';
    grid.appendChild(createEmptyState());
    return;
  }

  // Remove empty state if present
  if (emptyState) emptyState.remove();

  // Sync cards
  const existingIds = new Set([...grid.querySelectorAll('.session-card')].map(c => c.dataset.id));
  const currentIds = new Set(sessions.map(s => s.id));

  // Remove deleted sessions
  existingIds.forEach(id => {
    if (!currentIds.has(id)) {
      grid.querySelector(`[data-id="${id}"]`)?.remove();
    }
  });

  // Add/update sessions
  sessions.forEach(session => {
    let card = grid.querySelector(`[data-id="${session.id}"]`);
    if (!card) {
      card = createSessionCard(session);
      grid.appendChild(card);
    } else {
      updateSessionCard(card, session);
    }
  });
}

function createEmptyState() {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.id = 'empty-state';
  div.innerHTML = `
    <div class="empty-icon">📵</div>
    <p>Aucune session connectée</p>
    <p class="empty-sub">Clique sur "Ajouter Session" pour scanner un QR code</p>
  `;
  return div;
}

function createSessionCard(session) {
  const card = document.createElement('div');
  card.className = `session-card ${session.status}`;
  card.dataset.id = session.id;
  card.innerHTML = buildCardHTML(session);
  attachCardListeners(card, session);
  return card;
}

function updateSessionCard(card, session) {
  card.className = `session-card ${session.status}`;
  card.innerHTML = buildCardHTML(session);
  attachCardListeners(card, session);
}

function buildCardHTML(session) {
  const statusLabel = {
    connected: '🟢 Connecté',
    qr: '🟡 QR à scanner',
    disconnected: '🔴 Déconnecté',
    connecting: '🔵 Connexion...',
  }[session.status] || session.status;

  const user = session.user ? `<div class="session-user">📱 ${session.user.name || session.user.id?.split(':')[0] || 'Connecté'}</div>` : '';
  const qrBtn = session.hasQr ? `<button class="btn-qr" data-action="qr">📷 QR Code</button>` : '';

  return `
    <div class="session-header">
      <div class="session-status">
        <div class="status-indicator ${session.status}"></div>
        <span>${statusLabel}</span>
      </div>
      <button class="btn-danger" data-action="delete">✕</button>
    </div>
    <div class="session-id">🆔 ${session.id}</div>
    ${user}
    <div class="session-actions">
      ${qrBtn}
    </div>
  `;
}

function attachCardListeners(card, session) {
  card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
    if (confirm(`Supprimer la session ${session.id.slice(0, 8)}... ?`)) {
      socket.emit('delete_session', { sessionId: session.id });
      showToast('🗑️ Session supprimée', 'success');
    }
  });

  card.querySelector('[data-action="qr"]')?.addEventListener('click', () => {
    currentSessionId = session.id;
    socket.emit('join_session', session.id);
    showQrModal(session.id);
  });
}

// ── Stats ──────────────────────────────────────
function updateStats() {
  const total = sessions.length;
  const online = sessions.filter(s => s.status === 'connected').length;
  const max = 60;

  document.getElementById('session-count').textContent = total;
  document.getElementById('card-sessions').textContent = total;
  document.getElementById('card-online').textContent = online;

  const pct = Math.min((total / max) * 100, 100);
  const bar = document.getElementById('sessions-bar');
  if (bar) bar.style.width = `${pct}%`;
}

// ── Status ─────────────────────────────────────
function setStatus(state) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (state === 'online') {
    dot.classList.add('online');
    text.textContent = 'En ligne';
  } else {
    dot.classList.remove('online');
    text.textContent = 'Hors ligne';
  }
}

// ── QR Modal ───────────────────────────────────
function showQrModal(sessionId) {
  const modal = document.getElementById('qr-modal');
  const qrContainer = document.getElementById('qr-container');
  const sessionDisplay = document.getElementById('session-id-display');

  qrContainer.innerHTML = `
    <div class="qr-loading">
      <div class="spinner"></div>
      <p>Génération du QR code...</p>
    </div>
  `;
  sessionDisplay.textContent = `Session: ${sessionId}`;
  modal.style.display = 'flex';
  currentSessionId = sessionId;
}

function closeQrModal() {
  document.getElementById('qr-modal').style.display = 'none';
  currentSessionId = null;
}

function displayQr(qrDataUrl, sessionId) {
  const qrContainer = document.getElementById('qr-container');
  qrContainer.innerHTML = `<img src="${qrDataUrl}" alt="QR Code WhatsApp" />`;
  document.getElementById('session-id-display').textContent = `Session: ${sessionId}`;
}

// ── Toast ──────────────────────────────────────
let toastContainer;
function showToast(message, type = 'success') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}
