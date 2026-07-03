const { startWebServer }    = require('./src/web/server');
const { restoreAllSessions } = require('./src/lib/session-manager');
const config = require('./src/config');
const https  = require('https');
const http   = require('http');

console.log(config.banner);
console.log(`\n🤖 ${config.botName} v${config.version} — by ${config.dev}`);
console.log(`👑 Owner: ${config.ownerName} (+${config.ownerNumber})`);
console.log(`🌐 Prefixes: ${(config.prefixes || [config.prefix]).join('  ')}`);
console.log(`📱 Max sessions: ${config.maxSessions}`);
console.log('─'.repeat(45));

// ── Self-ping: keeps Render free tier awake every 4 minutes ──────────────────
function startKeepAlive() {
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${config.webPort}`;
  const pingUrl    = RENDER_URL.replace(/\/$/, '') + '/ping';
  const client     = pingUrl.startsWith('https') ? https : http;

  setInterval(() => {
    client.get(pingUrl, (res) => {
      if (res.statusCode !== 200) console.warn(`[PING] Unexpected status: ${res.statusCode}`);
    }).on('error', (e) => console.warn('[PING] Keep-alive failed:', e.message));
  }, 4 * 60 * 1000); // every 4 minutes

  console.log(`[PING] Keep-alive active → ${pingUrl}`);
}

(async () => {
  try {
    // 1. Start web server + get socket.io instance
    const { io } = await startWebServer();
    console.log(`✅ Web panel started on port ${config.webPort}`);

    // 2. Restore previously saved sessions
    await restoreAllSessions(io);

    // 3. Keep Render awake
    startKeepAlive();

    console.log('─'.repeat(45));
    console.log(`🚀 ${config.botName} is ready!`);
    console.log(`🌐 Panel: http://localhost:${config.webPort}`);
    console.log('─'.repeat(45));
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
