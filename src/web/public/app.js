// DENTSU CRASH v4.9.0 — Frontend Panel
// Connects to Render backend; falls back to same-origin for local dev
const BACKEND = 'https://dentsu-crash.onrender.com';
const socket  = io(BACKEND, { transports: ['websocket', 'polling'] });

// ── State ───────────────────────────────────────────────────────────────────
let sessions = [];
let codeTimerInterval = null;

// ── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  setupEventListeners();
});

// ── Particles ───────────────────────────────────────────────────────────────
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

// ── Socket Events ────────────────────────────────────────────────────────────
socket.on('connect', () => {
  setStatus('online');
  showToast('✅ Connected to server', 'success');
});

socket.on('disconnect', () => {
  setStatus('offline');
  showToast('❌ Disconnected from server', 'error');
});

socket.on('bot_info', (info) => {
  document.getElementById('max-sessions').textContent = info.maxSessions;
});

socket.on('sessions_update', (data) => {
  sessions = Array.isArray(data) ? data : [];
  updateSessionsUI();
  updateStats();
});

// Pairing started → waiting for code
socket.on('pair_started', ({ sessionId }) => {
  showConnectStatus('⏳ Generating code for session ' + sessionId.slice(0, 8) + '...', 'info');
});

// Pairing code received
socket.on('pairing_code', ({ sessionId, code }) => {
  showCode(code);
  showToast('🔑 Pairing code received!', 'success');
  startCodeTimer(60);
});

// Pairing error
socket.on('pair_error', ({ message }) => {
  showConnectStatus('❌ ' + message, 'error');
  showToast('❌ Pairing error: ' + message, 'error');
  setBtnState(false);
});

// Session fully connected
socket.on('connected', ({ sessionId }) => {
  hideCode();
  stopCodeTimer();
  showConnectStatus('✅ WhatsApp connected successfully!', 'success');
  showToast('✅ WhatsApp connected!', 'success');
  setBtnState(false);
  // Reset form after 3 s
  setTimeout(() => {
    document.getElementById('phone-input').value = '';
    hideConnectStatus();
  }, 3000);
});

socket.on('error', ({ message }) => {
  showToast('❌ ' + message, 'error');
  showConnectStatus('❌ ' + message, 'error');
  setBtnState(false);
});

// ── Event Listeners ──────────────────────────────────────────────────────────
function setupEventListeners() {
  const btn   = document.getElementById('btn-connect');
  const input = document.getElementById('phone-input');

  btn.addEventListener('click', handleConnect);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleConnect();
  });

  // Format phone number as user types
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^0-9+\-\s]/g, '');
  });
}

function handleConnect() {
  const input = document.getElementById('phone-input');
  const raw   = input.value.trim();
  const phone = raw.replace(/\D/g, '');

  if (phone.length < 7) {
    showConnectStatus('⚠️ Please enter a valid phone number with country code.', 'error');
    showToast('⚠️ Invalid phone number', 'error');
    return;
  }

  setBtnState(true);
  hideCode();
  showConnectStatus('⏳ Connecting to WhatsApp server...', 'info');
  socket.emit('pair_request', { phoneNumber: phone });
}

// ── Sessions UI ──────────────────────────────────────────────────────────────
function updateSessionsUI() {
  const grid       = document.getElementById('sessions-grid');
  const emptyState = document.getElementById('empty-state');
  const badge      = document.getElementById('sessions-badge');

  const connected = sessions.filter(s => s.status === 'connected').length;
  badge.textContent = `${connected} connected`;

  if (sessions.length === 0) {
    grid.innerHTML = '';
    grid.appendChild(createEmptyState());
    return;
  }

  if (emptyState) emptyState.remove();

  const existingIds = new Set([...grid.querySelectorAll('.session-card')].map(c => c.dataset.id));
  const currentIds  = new Set(sessions.map(s => s.id));

  existingIds.forEach(id => {
    if (!currentIds.has(id)) grid.querySelector(`[data-id="${id}"]`)?.remove();
  });

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
    <p>No sessions connected yet</p>
    <p class="empty-sub">Enter a phone number above to pair a WhatsApp account</p>
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
  const labels = {
    connected:  '🟢 Connected',
    pairing:    '🟡 Enter code in WhatsApp',
    disconnected:'🔴 Disconnected',
    connecting: '🔵 Connecting...',
  };
  const statusLabel = labels[session.status] || session.status;
  const user = session.user
    ? `<div class="session-user">📱 ${session.user.name || ('+' + session.user.id?.split(':')[0]) || 'Connected'}</div>`
    : '';
  const codeHtml = session.code
    ? `<div class="session-code">🔑 Code: <strong>${session.code}</strong></div>`
    : '';

  return `
    <div class="session-header">
      <div class="session-status">
        <div class="status-indicator ${session.status}"></div>
        <span>${statusLabel}</span>
      </div>
      <button class="btn-danger" data-action="delete" title="Disconnect session">✕</button>
    </div>
    <div class="session-id">🆔 ${session.id.slice(0, 16)}...</div>
    ${user}
    ${codeHtml}
  `;
}

function attachCardListeners(card, session) {
  card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
    if (confirm(`Disconnect session ${session.id.slice(0, 8)}...?`)) {
      socket.emit('delete_session', { sessionId: session.id });
      showToast('🗑️ Session removed', 'success');
    }
  });
}

// ── Stats ────────────────────────────────────────────────────────────────────
function updateStats() {
  const total   = sessions.length;
  const online  = sessions.filter(s => s.status === 'connected').length;
  const max     = parseInt(document.getElementById('max-sessions').textContent) || 60;

  document.getElementById('session-count').textContent = total;
  document.getElementById('card-sessions').textContent = total;
  document.getElementById('card-online').textContent   = online;

  const bar = document.getElementById('sessions-bar');
  if (bar) bar.style.width = `${Math.min((total / max) * 100, 100)}%`;
}

// ── Status dot ───────────────────────────────────────────────────────────────
function setStatus(state) {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (state === 'online') {
    dot.classList.add('online');
    text.textContent = 'Online';
  } else {
    dot.classList.remove('online');
    text.textContent = 'Offline';
  }
}

// ── Connect button state ──────────────────────────────────────────────────────
function setBtnState(loading) {
  const btn = document.getElementById('btn-connect');
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="spinner-sm"></span> Connecting...'
    : '<span class="btn-icon">📲</span> Get Pairing Code';
}

// ── Code display ──────────────────────────────────────────────────────────────
function showCode(code) {
  const box = document.getElementById('code-display');
  const val = document.getElementById('code-value');
  val.textContent = code;
  box.style.display = 'block';
  // Pulse animation
  val.classList.remove('pulse');
  void val.offsetWidth; // reflow
  val.classList.add('pulse');
}

function hideCode() {
  document.getElementById('code-display').style.display = 'none';
}

function startCodeTimer(seconds) {
  stopCodeTimer();
  let remaining = seconds;
  const el = document.getElementById('timer-count');
  if (el) el.textContent = remaining;

  codeTimerInterval = setInterval(() => {
    remaining--;
    if (el) el.textContent = remaining;
    if (remaining <= 0) {
      stopCodeTimer();
      const timer = document.getElementById('code-timer');
      if (timer) timer.textContent = '⚠️ Code may have expired. Try again if not connected.';
    }
  }, 1000);
}

function stopCodeTimer() {
  if (codeTimerInterval) {
    clearInterval(codeTimerInterval);
    codeTimerInterval = null;
  }
}

// ── Connect status ───────────────────────────────────────────────────────────
function showConnectStatus(msg, type) {
  const el = document.getElementById('connect-status');
  el.textContent = msg;
  el.className   = `connect-status connect-status-${type}`;
  el.style.display = 'block';
}

function hideConnectStatus() {
  document.getElementById('connect-status').style.display = 'none';
}

// ── Toast ────────────────────────────────────────────────────────────────────
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
  setTimeout(() => toast.remove(), 3500);
}
