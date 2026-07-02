const { startWebServer } = require('./src/web/server');
const { restoreAllSessions } = require('./src/lib/session-manager');
const config = require('./src/config');

console.log(config.banner);
console.log(`\n🤖 ${config.botName} v${config.version} — by ${config.dev}`);
console.log(`👑 Owner: ${config.ownerName} (+${config.ownerNumber})`);
console.log(`🌐 Prefixes: ${(config.prefixes || [config.prefix]).join('  ')}`);
console.log(`📱 Max sessions: ${config.maxSessions}`);
console.log('─'.repeat(45));

(async () => {
  try {
    // 1. Start web server + get socket.io instance
    const { io } = await startWebServer();
    console.log(`✅ Web panel started on port ${config.webPort}`);

    // 2. Restore previously saved sessions
    await restoreAllSessions(io);

    console.log('─'.repeat(45));
    console.log(`🚀 ${config.botName} is ready!`);
    console.log(`🌐 Panel: http://localhost:${config.webPort}`);
    console.log('─'.repeat(45));
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
