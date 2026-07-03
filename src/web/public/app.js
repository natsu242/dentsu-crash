// DENTSU CRASH v4.9.0 — Frontend
'use strict';

// ── Globals ──────────────────────────────────────────────────────────────────
const BACKEND = window.SOCKET_URL || 'https://dentsu-crash.onrender.com';
let   socket  = null;
let   codeTimerInterval = null;
let   currentLang = 'en';

// Expose splash handlers globally (inline onclick compatibility)
window.setLang        = setLang;
window.handleAccept   = handleAccept;
window.handleRefuse   = handleRefuse;
window.showTermsAgain = showTermsAgain;

// ════════════════════════════════════════════════════════════════════
//  SPLASH — Language & T&C logic
// ════════════════════════════════════════════════════════════════════

function setLang(lang) {
  currentLang = lang;

  var btnEn = document.getElementById('lang-en');
  var btnFr = document.getElementById('lang-fr');
  if (btnEn) btnEn.className = 'lang-btn' + (lang === 'en' ? ' active' : '');
  if (btnFr) btnFr.className = 'lang-btn' + (lang === 'fr' ? ' active' : '');

  var tcEn = document.getElementById('tc-en');
  var tcFr = document.getElementById('tc-fr');
  if (tcEn) tcEn.style.display = lang === 'en' ? 'block' : 'none';
  if (tcFr) tcFr.style.display = lang === 'fr' ? 'block' : 'none';

  // Update all bilingual [data-en] / [data-fr] elements
  var els = document.querySelectorAll('[data-en]');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    el.innerHTML = lang === 'fr' ? (el.getAttribute('data-fr') || '') : (el.getAttribute('data-en') || '');
  }
}

function handleRefuse() {
  var actions = document.getElementById('splash-actions');
  var scroll  = document.querySelector('.splash-terms-scroll');
  var refused = document.getElementById('splash-refused');
  if (actions) actions.style.display = 'none';
  if (scroll)  scroll.style.display  = 'none';
  if (refused) refused.style.display = 'block';

  var msg = document.querySelector('.refused-msg');
  if (msg) msg.innerHTML = currentLang === 'fr'
    ? "Vous avez refusé les Termes &amp; Conditions. L'accès à <strong>DENTSU CRASH</strong> n'est pas disponible."
    : "You have refused the Terms &amp; Conditions. Access to <strong>DENTSU CRASH</strong> is not available.";

  var back = document.querySelector('.btn-back span');
  if (back) back.textContent = currentLang === 'fr' ? '← Retour' : '← Go Back';
}

function showTermsAgain() {
  var refused = document.getElementById('splash-refused');
  var scroll  = document.querySelector('.splash-terms-scroll');
  var actions = document.getElementById('splash-actions');
  if (refused) refused.style.display = 'none';
  if (scroll)  scroll.style.display  = 'block';
  if (actions) actions.style.display = 'flex';
}

function handleAccept() {
  var splash = document.getElementById('splash');
  var app    = document.getElementById('app');

  if (!splash || !app) {
    // Fallback: just show the app directly
    if (app) { app.style.display = 'block'; }
    return;
  }

  // Step 1 — fade out the splash with inline styles (no CSS class dependency)
  splash.style.transition  = 'opacity 0.45s ease, transform 0.45s ease';
  splash.style.opacity     = '0';
  splash.style.transform   = 'scale(1.04)';
  splash.style.pointerEvents = 'none';

  // Step 2 — after animation, hide splash and reveal app
  setTimeout(function () {
    // Hide splash completely
    splash.style.display = 'none';

    // Show main app
    app.style.display    = 'block';
    app.style.opacity    = '0';
    app.style.transition = 'opacity 0.4s ease';
    // Force reflow so transition fires
    void app.offsetHeight;
    app.style.opacity = '1';

    // Start socket (wrapped in try-catch — never blocks UI)
    try { initSocket(); } catch (e) { console.warn('[Socket] init failed:', e.message); }

    // Start video loop
    ensureVideoLoop();
  }, 460);
}

// ════════════════════════════════════════════════════════════════════
//  MAIN APP — Socket & UI
// ════════════════════════════════════════════════════════════════════

function initSocket() {
  if (typeof io === 'undefined') {
    console.warn('[Socket] socket.io not loaded yet — retrying in 3s');
    setTimeout(function () {
      if (typeof io !== 'undefined') initSocket();
    }, 3000);
    return;
  }

  socket = io(BACKEND, { transports: ['websocket', 'polling'] });

  socket.on('connect', function () {
    setStatus('online');
    showToast('✅ Connected to server', 'success');
  });

  socket.on('disconnect', function () {
    setStatus('offline');
    showToast('❌ Disconnected from server', 'error');
  });

  socket.on('pair_started', function () {
    showConnectStatus('⏳ Connecting to WhatsApp... waiting for code.', 'info');
  });

  socket.on('pairing_code', function (data) {
    showCode(data.code);
    showToast('🔑 Pairing code received!', 'success');
    startCodeTimer(60);
  });

  socket.on('pair_error', function (data) {
    showConnectStatus('❌ ' + data.message, 'error');
    showToast('❌ ' + data.message, 'error');
    setBtnState(false);
  });

  socket.on('connected', function () {
    hideCode();
    stopCodeTimer();
    showConnectStatus('✅ WhatsApp connected! Check your phone for the welcome message.', 'success');
    showToast('✅ WhatsApp connected!', 'success');
    setBtnState(false);
    setTimeout(function () {
      var inp = document.getElementById('phone-input');
      if (inp) inp.value = '';
      hideConnectStatus();
    }, 5000);
  });

  socket.on('error', function (data) {
    showToast('❌ ' + data.message, 'error');
    showConnectStatus('❌ ' + data.message, 'error');
    setBtnState(false);
  });
}

function ensureVideoLoop() {
  var vid = document.getElementById('bg-video');
  if (!vid) return;
  vid.addEventListener('ended', function () { vid.currentTime = 0; vid.play(); });
  vid.play().catch(function () {
    document.addEventListener('click', function () { vid.play(); }, { once: true });
  });
}

// ── Event listeners ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  var btn   = document.getElementById('btn-connect');
  var input = document.getElementById('phone-input');

  if (btn)   btn.addEventListener('click', handleConnect);
  if (input) {
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleConnect(); });
    input.addEventListener('input',   function ()  { input.value = input.value.replace(/[^0-9]/g, ''); });
  }
});

function handleConnect() {
  if (!socket) {
    showConnectStatus('⚠️ Server not connected yet. Please wait...', 'error');
    return;
  }
  var input = document.getElementById('phone-input');
  var phone = input.value.replace(/\D/g, '').trim();
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
  var dot  = document.getElementById('status-dot');
  var text = document.getElementById('status-text');
  if (dot)  dot.className = 'status-dot' + (state === 'online' ? ' online' : '');
  if (text) text.textContent = state === 'online' ? 'Online' : 'Offline';
}

// ── Button state ─────────────────────────────────────────────────────────────
function setBtnState(loading) {
  var btn = document.getElementById('btn-connect');
  if (!btn) return;
  btn.disabled  = loading;
  btn.innerHTML = loading
    ? '<span class="spinner-sm"></span> Connecting...'
    : '<span class="btn-icon">📲</span> Get Pairing Code';
}

// ── Code display ──────────────────────────────────────────────────────────────
function showCode(code) {
  var box = document.getElementById('code-display');
  var val = document.getElementById('code-value');
  if (!box || !val) return;
  val.textContent = code;
  box.style.display = 'block';
  val.classList.remove('pulse');
  void val.offsetWidth;
  val.classList.add('pulse');
}
function hideCode() {
  var box = document.getElementById('code-display');
  if (box) box.style.display = 'none';
}

function startCodeTimer(sec) {
  stopCodeTimer();
  var rem = sec;
  var el  = document.getElementById('timer-count');
  if (el) el.textContent = rem;
  codeTimerInterval = setInterval(function () {
    rem--;
    if (el) el.textContent = rem;
    if (rem <= 0) {
      stopCodeTimer();
      var timerEl = document.getElementById('code-timer');
      if (timerEl) timerEl.textContent = '⚠️ Code may have expired. Try again if not connected.';
    }
  }, 1000);
}
function stopCodeTimer() {
  if (codeTimerInterval) { clearInterval(codeTimerInterval); codeTimerInterval = null; }
}

// ── Connect status ───────────────────────────────────────────────────────────
function showConnectStatus(msg, type) {
  var el = document.getElementById('connect-status');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'connect-status connect-status-' + type;
  el.style.display = 'block';
}
function hideConnectStatus() {
  var el = document.getElementById('connect-status');
  if (el) el.style.display = 'none';
}

// ── Toast ────────────────────────────────────────────────────────────────────
var toastContainer;
function showToast(message, type) {
  type = type || 'success';
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  var t = document.createElement('div');
  t.className   = 'toast ' + type;
  t.textContent = message;
  toastContainer.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
}
