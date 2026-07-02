// DENTSU CRASH v4.9.0 — Frontend Panel
const BACKEND = window.SOCKET_URL || 'https://dentsu-crash.onrender.com';
const socket  = io(BACKEND, { transports: ['websocket', 'polling'] });

// ── State ───────────────────────────────────────────────────────────────────
let codeTimerInterval = null;

// ── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  ensureVideoLoop();
});

// ── Video background loop failsafe ───────────────────────────────────────────
function ensureVideoLoop() {
  const vid = document.getElementById('bg-video');
  if (!vid) return;
  vid.addEventListener('ended', () => { vid.currentTime = 0; vid.play(); });
  vid.play().catch(() => {
    // Autoplay blocked — try on first user interaction
    document.addEventListener('click', () => vid.play(), { once: true });
  });
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

socket.on('pair_started', () => {
  showConnectStatus('⏳ Connecting to WhatsApp... waiting for code.', 'info');
});

socket.on('pairing_code', ({ code }) => {
  showCode(code);
  showToast('🔑 Pairing code received!', 'success');
  startCodeTimer(60);
});

socket.on('pair_error', ({ message }) => {
  showConnectStatus('❌ ' + message, 'error');
  showToast('❌ ' + message, 'error');
  setBtnState(false);
});

socket.on('connected', () => {
  hideCode();
  stopCodeTimer();
  showConnectStatus('✅ WhatsApp connected! Check your phone for the welcome message.', 'success');
  showToast('✅ WhatsApp connected!', 'success');
  setBtnState(false);
  setTimeout(() => {
    document.getElementById('phone-input').value = '';
    hideConnectStatus();
  }, 5000);
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
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleConnect(); });
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^0-9]/g, '');
  });
}

function handleConnect() {
  const input = document.getElementById('phone-input');
  const phone = input.value.replace(/\D/g, '').trim();

  if (phone.length < 7) {
    showConnectStatus('⚠️ Please enter a valid phone number with country code.', 'error');
    return;
  }

  setBtnState(true);
  hideCode();
  showConnectStatus('⏳ Sending request...', 'info');
  socket.emit('pair_request', { phoneNumber: phone });
}

// ── Status dot ───────────────────────────────────────────────────────────────
function setStatus(state) {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  dot.classList.toggle('online', state === 'online');
  text.textContent = state === 'online' ? 'Online' : 'Offline';
}

// ── Button state ─────────────────────────────────────────────────────────────
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
  val.classList.remove('pulse');
  void val.offsetWidth;
  val.classList.add('pulse');
}
function hideCode() {
  document.getElementById('code-display').style.display = 'none';
}

function startCodeTimer(sec) {
  stopCodeTimer();
  let rem = sec;
  const el = document.getElementById('timer-count');
  if (el) el.textContent = rem;
  codeTimerInterval = setInterval(() => {
    rem--;
    if (el) el.textContent = rem;
    if (rem <= 0) {
      stopCodeTimer();
      const timerEl = document.getElementById('code-timer');
      if (timerEl) timerEl.textContent = '⚠️ Code may have expired. Try again if not connected.';
    }
  }, 1000);
}
function stopCodeTimer() {
  if (codeTimerInterval) { clearInterval(codeTimerInterval); codeTimerInterval = null; }
}

// ── Connect status ───────────────────────────────────────────────────────────
function showConnectStatus(msg, type) {
  const el = document.getElementById('connect-status');
  el.textContent = msg;
  el.className   = `connect-status connect-status-${type}`;
  el.style.display = 'block';
}
function hideConnectStatus() {
  const el = document.getElementById('connect-status');
  if (el) el.style.display = 'none';
}

// ── Toast ────────────────────────────────────────────────────────────────────
let toastContainer;
function showToast(message, type = 'success') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const t = document.createElement('div');
  t.className   = `toast ${type}`;
  t.textContent = message;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
