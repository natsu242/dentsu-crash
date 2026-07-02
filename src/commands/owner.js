const { reply, isOwner, formatBytes, formatDuration } = require('../lib/utils');
const { getSessionCount, getSessionsInfo, deleteSession } = require('../lib/session-manager');
const config = require('../config');
const os = require('os');

async function ownerMenu(sock, msg, args, from, sender) {
  if (!isOwner(sender.replace('@s.whatsapp.net', ''))) {
    return reply(sock, msg, '❌ Cette commande est réservée au propriétaire du bot.');
  }

  const cmd = args[0]?.toLowerCase();

  switch (cmd) {
    case 'broadcast':
    case 'diffuser': {
      const text = args.slice(1).join(' ');
      if (!text) return reply(sock, msg, '❌ Usage: !broadcast <message>');
      const chats = await sock.groupFetchAllParticipating();
      const groups = Object.keys(chats);
      let sent = 0;
      for (const g of groups) {
        try {
          await sock.sendMessage(g, { text: `📢 *[BROADCAST]*\n\n${text}\n\n— ${config.botName}` });
          sent++;
          await new Promise(r => setTimeout(r, 500));
        } catch (_) {}
      }
      await reply(sock, msg, `✅ Broadcast envoyé à ${sent}/${groups.length} groupes.`);
      break;
    }

    case 'block':
    case 'bloquer': {
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || (args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply(sock, msg, '❌ Mentionne ou donne le numéro à bloquer.');
      await sock.updateBlockStatus(target, 'block');
      await reply(sock, msg, `🚫 ${target.split('@')[0]} bloqué.`);
      break;
    }

    case 'unblock':
    case 'debloquer': {
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || (args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply(sock, msg, '❌ Mentionne ou donne le numéro à débloquer.');
      await sock.updateBlockStatus(target, 'unblock');
      await reply(sock, msg, `✅ ${target.split('@')[0]} débloqué.`);
      break;
    }

    case 'listgc':
    case 'listegroupes': {
      const chats = await sock.groupFetchAllParticipating();
      const groups = Object.values(chats);
      let text = `╔═══ 📋 *LISTE DES GROUPES* ═══╗\n║ Total: ${groups.length} groupes\n╚═══════════════════════════╝\n\n`;
      groups.slice(0, 30).forEach((g, i) => {
        text += `${i + 1}. ${g.subject} (${g.participants.length} membres)\n`;
      });
      if (groups.length > 30) text += `\n...et ${groups.length - 30} autres.`;
      await reply(sock, msg, text);
      break;
    }

    case 'joingc': {
      const link = args[1];
      if (!link) return reply(sock, msg, '❌ Usage: !joingc <lien>');
      const code = link.split('https://chat.whatsapp.com/')[1];
      if (!code) return reply(sock, msg, '❌ Lien invalide.');
      try {
        await sock.groupAcceptInvite(code);
        await reply(sock, msg, '✅ Rejoint le groupe avec succès.');
      } catch {
        await reply(sock, msg, '❌ Impossible de rejoindre ce groupe.');
      }
      break;
    }

    case 'leavegc':
    case 'quittergc': {
      if (!from.endsWith('@g.us')) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      await reply(sock, msg, '👋 Je quitte le groupe...');
      await sock.groupLeave(from);
      break;
    }

    case 'owner':
    case 'info': {
      const text = `╔═══ 👑 *OWNER INFO* ═══╗
║ 🤖 Bot: ${config.botName} v${config.version}
║ 👤 Owner: ${config.ownerName}
║ 📱 Numéro: ${config.ownerNumber}
║ 💻 Dev: ${config.dev}
║ 🌐 GitHub: ${config.github}
╚═══════════════════════════╝`;
      await reply(sock, msg, text);
      break;
    }

    case 'sessions': {
      const infos = getSessionsInfo();
      let text = `╔═══ 📊 *SESSIONS ACTIVES* ═══╗\n║ Total: ${infos.length}/${config.maxSessions}\n╚══════════════════════════╝\n\n`;
      infos.forEach((s, i) => {
        const status = s.status === 'connected' ? '🟢' : s.status === 'qr' ? '🟡' : '🔴';
        text += `${i + 1}. ${status} ${s.id.slice(0, 8)}... — ${s.status}\n`;
      });
      await reply(sock, msg, text);
      break;
    }

    case 'delsession': {
      const sid = args[1];
      if (!sid) return reply(sock, msg, '❌ Usage: !delsession <sessionId>');
      await deleteSession(sid);
      await reply(sock, msg, `✅ Session ${sid} supprimée.`);
      break;
    }

    case 'setprefix': {
      const newPrefix = args[1];
      if (!newPrefix || newPrefix.length > 3) return reply(sock, msg, '❌ Usage: !setprefix <symbole>');
      config.prefix = newPrefix;
      await reply(sock, msg, `✅ Préfixe changé en: ${newPrefix}`);
      break;
    }

    case 'setbio': {
      const bio = args.slice(1).join(' ');
      if (!bio) return reply(sock, msg, '❌ Usage: !setbio <texte>');
      await sock.updateProfileStatus(bio);
      await reply(sock, msg, `✅ Bio mise à jour: ${bio}`);
      break;
    }

    case 'setbotname': {
      const name = args.slice(1).join(' ');
      if (!name) return reply(sock, msg, '❌ Usage: !setbotname <nom>');
      await sock.updateProfileName(name);
      await reply(sock, msg, `✅ Nom du bot mis à jour: ${name}`);
      break;
    }

    case 'speedtest':
    case 'ping': {
      const start = Date.now();
      await reply(sock, msg, '⏳ Test en cours...');
      const latency = Date.now() - start;
      const uptime = process.uptime();
      const text = `╔═══ ⚡ *SPEED TEST* ═══╗
║ 📡 Latence: ${latency}ms
║ ⏱️ Uptime: ${formatDuration(uptime * 1000)}
║ 💾 RAM: ${formatBytes(os.totalmem() - os.freemem())} / ${formatBytes(os.totalmem())}
║ 🖥️ OS: ${os.type()} ${os.arch()}
║ 📦 Sessions: ${getSessionCount()}/${config.maxSessions}
╚══════════════════════════╝`;
      await reply(sock, msg, text);
      break;
    }

    case 'restart':
    case 'redemarrer': {
      await reply(sock, msg, '🔄 Redémarrage en cours...');
      setTimeout(() => process.exit(0), 1000);
      break;
    }

    case 'shutdown':
    case 'eteindre': {
      await reply(sock, msg, '🛑 Arrêt du bot...');
      setTimeout(() => process.exit(1), 1000);
      break;
    }

    case 'eval':
    case 'exec': {
      const code = args.slice(1).join(' ');
      if (!code) return reply(sock, msg, '❌ Usage: !eval <code>');
      try {
        let result = eval(code);
        if (result instanceof Promise) result = await result;
        await reply(sock, msg, `✅ Résultat:\n${JSON.stringify(result, null, 2)}`);
      } catch (err) {
        await reply(sock, msg, `❌ Erreur:\n${err.message}`);
      }
      break;
    }

    case 'sysinfo':
    case 'systeme': {
      const mem = process.memoryUsage();
      const text = `╔═══ 🖥️ *SYSTEM INFO* ═══╗
║ 🖥️ OS: ${os.type()} ${os.platform()}
║ 🔢 Arch: ${os.arch()}
║ 💻 CPU: ${os.cpus()[0]?.model || 'Inconnu'}
║ 🧠 RAM Total: ${formatBytes(os.totalmem())}
║ 📊 RAM Libre: ${formatBytes(os.freemem())}
║ 🟢 Process RAM: ${formatBytes(mem.rss)}
║ ⏱️ Uptime Sys: ${formatDuration(os.uptime() * 1000)}
║ ⏱️ Uptime Bot: ${formatDuration(process.uptime() * 1000)}
║ 📦 Sessions: ${getSessionCount()}/${config.maxSessions}
╚══════════════════════════╝`;
      await reply(sock, msg, text);
      break;
    }

    case 'getid': {
      await reply(sock, msg, `🆔 ID:\n${from}`);
      break;
    }

    case 'activegc': {
      const chats = await sock.groupFetchAllParticipating();
      await reply(sock, msg, `✅ Groupes actifs: ${Object.keys(chats).length}`);
      break;
    }

    default:
      return null;
  }
}

module.exports = { ownerMenu };
