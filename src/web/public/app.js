// DENTSU CRASH v4.9.0 — Frontend
'use strict';

// ── Globals ──────────────────────────────────────────────────────────────────
const BACKEND = window.SOCKET_URL || 'https://dentsu-crash.onrender.com';
let   socket  = null;
let   codeTimerInterval = null;
let   currentLang = 'en';

// Expose splash handlers globally so inline onclick works even if this script
// is ever wrapped in a module or bundled in the future.
window.setLang       = (...a) => setLang(...a);
window.handleAccept  = () => handleAccept();
window.handleRefuse  = () => handleRefuse();
window.showTermsAgain = () => showTermsAgain();

// ════════════════════════════════════════════════════════════════════
//  SPLASH — Language & T&C logic
// ════════════════════════════════════════════════════════════════════

/** Switch language on the splash screen */
function setLang(lang) {
  currentLang = lang;

  // Toggle active button
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('lang-fr').classList.toggle('active', lang === 'fr');

  // Show/hide T&C blocks
  const en = document.getElementById('tc-en');
  const fr = document.getElementById('tc-fr');
  if (en) en.style.display = lang === 'en' ? 'block' : 'none';
  if (fr) fr.style.display = lang === 'fr' ? 'block' : 'none';

  // Translate all [data-en] / [data-fr] elements
  document.querySelectorAll('[data-en]').forEach(el => {
    el.innerHTML = lang === 'fr' ? el.dataset.fr : el.dataset.en;
  });
}

/** User clicked Refuse */
function handleRefuse() {
  document.getElementById('splash-actions').style.display = 'none';
  document.querySelector('.splash-terms-scroll').style.display = 'none';
  document.getElementById('splash-refused').style.display = 'block';
  // Apply language to refused message
  const msg = document.querySelector('.refused-msg');
  if (msg) msg.innerHTML = currentLang === 'fr'
    ? "Vous avez refusé les Termes &amp; Conditions. L'accès à <strong>DENTSU CRASH</strong> n'est pas disponible."
    : "You have refused the Terms &amp; Conditions. Access to <strong>DENTSU CRASH</strong> is not available.";
  // Apply language to back button
  const back = document.querySelector('.btn-back span');
  if (back) back.textContent = currentLang === 'fr' ? '← Retour' : '← Go Back';
}

/** User clicked Go Back from refused screen */
function showTermsAgain() {
  document.getElementById('splash-refused').style.display = 'none';
  document.querySelector('.splash-terms-scroll').style.display = 'block';
  document.getElementById('splash-actions').style.display = 'flex';
}

/** User clicked Accept */
function handleAccept() {
  const splash = document.getElementById('splash');
  const app    = document.getElementById('app');

  // Animate splash out
  splash.classList.add('hiding');
  setTimeout(() => {
    splash.classList.add('gone');
    app.className = 'app-visible';
    initSocket();
    ensureVideoLoop();
  }, 520);
}

// ════════════════════════════════════════════════════════════════════
//  MAIN APP — Socket & UI
// ════════════════════════════════════════════════════════════════════

function initSocket() {
  socket = io(BACKEND, { transports: ['websocket', 'polling'] });

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
}

function ensureVideoLoop() {
  const vid = document.getElementById('bg-video');
  if (!vid) return;
  vid.addEventListener('ended', () => { vid.currentTime = 0; vid.play(); });
  vid.play().catch(() => {
    document.addEventListener('click', () => vid.play(), { once: true });
  });
}

// ── Event listeners ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const btn   = document.getElementById('btn-connect');
  const input = document.getElementById('phone-input');
  if (btn)   btn.addEventListener('click', handleConnect);
  if (input) {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') handleConnect(); });
    input.addEventListener('input',   () => { input.value = input.value.replace(/[^0-9]/g, ''); });
  }
});

function handleConnect() {
  if (!socket) return;
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
  if (dot)  dot.classList.toggle('online', state === 'online');
  if (text) text.textContent = state === 'online' ? 'Online' : 'Offline';
}

// ── Button state ─────────────────────────────────────────────────────────────
function setBtnState(loading) {
  const btn = document.getElementById('btn-connect');
  if (!btn) return;
  btn.disabled  = loading;
  btn.innerHTML = loading
    ? '<span class="spinner-sm"></span> Connecting...'
    : '<span class="btn-icon">📲</span> Get Pairing Code';
}

// ── Code display ──────────────────────────────────────────────────────────────
function showCode(code) {
  const box = document.getElementById('code-display');
  const val = document.getElementById('code-value');
  if (!box || !val) return;
  val.textContent = code;
  box.style.display = 'block';
  val.classList.remove('pulse');
  void val.offsetWidth;
  val.classList.add('pulse');
}
function hideCode() {
  const box = document.getElementById('code-display');
  if (box) box.style.display = 'none';
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
  if (!el) return;
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
