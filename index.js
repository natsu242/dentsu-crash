require('dotenv').config();
const config = require('./src/config');
const { createSession, getSessionsInfo } = require('./src/lib/session-manager');
const { startWebServer } = require('./src/web/server');
const fs = require('fs-extra');

console.log(config.banner);
console.log(`\n  🚀 Démarrage de ${config.botName} v${config.version}...`);
console.log(`  💻 Développé par ${config.dev}`);
console.log(`  👑 Owner: ${config.ownerName} (${config.ownerNumber})`);
console.log(`  📦 Max sessions: ${config.maxSessions}`);
console.log('  ─────────────────────────────\n');

async function main() {
  // Créer le dossier sessions si inexistant
  await fs.ensureDir(config.sessionDir);

  // Démarrer le serveur web (QR panel)
  const { io, server } = await startWebServer();
  console.log(`  🌐 Panel web: http://localhost:${config.webPort}`);

  // Restaurer les sessions existantes
  const existingSessions = await fs.readdir(config.sessionDir).catch(() => []);
  const validSessions = existingSessions.filter(
    (s) => !s.startsWith('.') && fs.existsSync(`${config.sessionDir}/${s}/creds.json`)
  );

  if (validSessions.length > 0) {
    console.log(`  ♻️  Restauration de ${validSessions.length} session(s)...`);
    for (const sessionId of validSessions) {
      try {
        await createSession(sessionId, io);
        console.log(`  ✅ Session restaurée: ${sessionId.slice(0, 8)}...`);
      } catch (err) {
        console.error(`  ❌ Échec restauration ${sessionId}: ${err.message}`);
      }
    }
  } else {
    console.log('  📱 Aucune session. Scanne un QR code sur le panel web.');
  }

  console.log('\n  ─────────────────────────────');
  console.log(`  ✅ ${config.botName} v${config.version} opérationnel !`);
  console.log('  ─────────────────────────────\n');

  // Gestion des signaux
  process.on('SIGINT', async () => {
    console.log('\n  🛑 Arrêt propre du bot...');
    process.exit(0);
  });

  process.on('uncaughtException', (err) => {
    console.error(`  ❌ Exception non gérée: ${err.message}`);
  });

  process.on('unhandledRejection', (reason) => {
    console.error(`  ❌ Promesse rejetée: ${reason}`);
  });
}

main().catch((err) => {
  console.error(`  ❌ Erreur fatale: ${err.message}`);
  process.exit(1);
});
