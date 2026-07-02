const { reply, isOwner, formatBytes, formatDuration } = require('../lib/utils');
const { getSessionCount, getSessionsInfo, deleteSession } = require('../lib/session-manager');
const config = require('../config');
const os = require('os');

async function ownerMenu(sock, msg, args, from, sender) {
  if (!isOwner(sender)) {
    return reply(sock, msg, '❌ This command is reserved for the bot owner.');
  }

  const cmd = args[0]?.toLowerCase();

  switch (cmd) {

    case 'broadcast': {
      const text = args.slice(1).join(' ');
      if (!text) return reply(sock, msg, '❌ Usage: .broadcast <message>');
      const chats  = await sock.groupFetchAllParticipating();
      const groups = Object.keys(chats);
      let sent = 0;
      for (const g of groups) {
        try {
          await sock.sendMessage(g, { text: `📢 *[BROADCAST]*\n\n${text}\n\n— ${config.botName}` });
          sent++;
          await new Promise(r => setTimeout(r, 500));
        } catch (_) {}
      }
      await reply(sock, msg, `✅ Broadcast sent to ${sent}/${groups.length} groups.`);
      break;
    }

    case 'block': {
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || (args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply(sock, msg, '❌ Mention or provide the number to block.');
      await sock.updateBlockStatus(target, 'block');
      await reply(sock, msg, `🚫 +${target.split('@')[0]} has been blocked.`);
      break;
    }

    case 'unblock': {
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || (args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply(sock, msg, '❌ Mention or provide the number to unblock.');
      await sock.updateBlockStatus(target, 'unblock');
      await reply(sock, msg, `✅ +${target.split('@')[0]} has been unblocked.`);
      break;
    }

    case 'listgc': {
      const chats  = await sock.groupFetchAllParticipating();
      const groups = Object.values(chats);
      let text = `╔═══ 📋 *GROUP LIST* ═══╗\n║ Total: ${groups.length} groups\n╚═══════════════════════╝\n\n`;
      groups.slice(0, 30).forEach((g, i) => {
        text += `${i + 1}. ${g.subject} (${g.participants.length} members)\n`;
      });
      if (groups.length > 30) text += `\n...and ${groups.length - 30} more.`;
      await reply(sock, msg, text);
      break;
    }

    case 'joingc': {
      const link = args[1];
      if (!link) return reply(sock, msg, '❌ Usage: .joingc <invite-link>');
      const code = link.split('https://chat.whatsapp.com/')[1];
      if (!code) return reply(sock, msg, '❌ Invalid invite link.');
      try {
        await sock.groupAcceptInvite(code);
        await reply(sock, msg, '✅ Joined the group successfully.');
      } catch {
        await reply(sock, msg, '❌ Could not join this group.');
      }
      break;
    }

    case 'leavegc': {
      if (!from.endsWith('@g.us')) return reply(sock, msg, '❌ Use this command inside a group.');
      await reply(sock, msg, '👋 Leaving the group...');
      await sock.groupLeave(from);
      break;
    }

    case 'owner':
    case 'info': {
      const text = `╔═══ 👑 *OWNER INFO* ═══╗
║ 🤖 Bot: ${config.botName} v${config.version}
║ 👤 Owner: ${config.ownerName}
║ 📱 Number: +${config.ownerNumber}
║ 💻 Dev: ${config.dev}
║ 🌐 GitHub: ${config.github}
╚════════════════════════╝`;
      await reply(sock, msg, text);
      break;
    }

    case 'sessions': {
      const infos = getSessionsInfo();
      let text = `╔═══ 📊 *ACTIVE SESSIONS* ═══╗\n║ Total: ${infos.length}/${config.maxSessions}\n╚═══════════════════════════╝\n\n`;
      infos.forEach((s, i) => {
        const dot = s.status === 'connected' ? '🟢' : s.status === 'pairing' ? '🟡' : '🔴';
        text += `${i + 1}. ${dot} ${s.id.slice(0, 8)}... — ${s.status}\n`;
      });
      await reply(sock, msg, text);
      break;
    }

    case 'delsession': {
      const sid = args[1];
      if (!sid) return reply(sock, msg, '❌ Usage: .delsession <sessionId>');
      await deleteSession(sid);
      await reply(sock, msg, `✅ Session ${sid} deleted.`);
      break;
    }

    case 'setprefix': {
      const newPrefix = args[1];
      if (!newPrefix || newPrefix.length > 3) return reply(sock, msg, '❌ Usage: .setprefix <symbol>');
      config.prefix = newPrefix;
      if (config.prefixes) config.prefixes[0] = newPrefix;
      await reply(sock, msg, `✅ Default prefix changed to: *${newPrefix}*`);
      break;
    }

    case 'setbio': {
      const bio = args.slice(1).join(' ');
      if (!bio) return reply(sock, msg, '❌ Usage: .setbio <text>');
      await sock.updateProfileStatus(bio);
      await reply(sock, msg, `✅ Bio updated: ${bio}`);
      break;
    }

    case 'setbotname': {
      const name = args.slice(1).join(' ');
      if (!name) return reply(sock, msg, '❌ Usage: .setbotname <name>');
      await sock.updateProfileName(name);
      await reply(sock, msg, `✅ Bot name updated: ${name}`);
      break;
    }

    case 'speedtest':
    case 'ping': {
      const start = Date.now();
      await reply(sock, msg, '⏳ Running speed test...');
      const latency = Date.now() - start;
      const text = `╔═══ ⚡ *SPEED TEST* ═══╗
║ 📡 Latency: ${latency}ms
║ ⏱️  Uptime: ${formatDuration(process.uptime() * 1000)}
║ 💾 RAM: ${formatBytes(os.totalmem() - os.freemem())} / ${formatBytes(os.totalmem())}
║ 🖥️  OS: ${os.type()} ${os.arch()}
║ 📦 Sessions: ${getSessionCount()}/${config.maxSessions}
╚═══════════════════════╝`;
      await reply(sock, msg, text);
      break;
    }

    case 'restart': {
      await reply(sock, msg, '🔄 Restarting bot...');
      setTimeout(() => process.exit(0), 1000);
      break;
    }

    case 'shutdown': {
      await reply(sock, msg, '🛑 Shutting down bot...');
      setTimeout(() => process.exit(1), 1000);
      break;
    }

    case 'eval':
    case 'exec': {
      const code = args.slice(1).join(' ');
      if (!code) return reply(sock, msg, '❌ Usage: .eval <code>');
      try {
        let result = eval(code); // eslint-disable-line no-eval
        if (result instanceof Promise) result = await result;
        await reply(sock, msg, `✅ Result:\n${JSON.stringify(result, null, 2)}`);
      } catch (err) {
        await reply(sock, msg, `❌ Error:\n${err.message}`);
      }
      break;
    }

    case 'sysinfo': {
      const mem  = process.memoryUsage();
      const text = `╔═══ 🖥️  *SYSTEM INFO* ═══╗
║ 🖥️  OS: ${os.type()} ${os.platform()}
║ 🔢 Arch: ${os.arch()}
║ 💻 CPU: ${os.cpus()[0]?.model?.slice(0, 28) || 'Unknown'}
║ 🧠 RAM Total: ${formatBytes(os.totalmem())}
║ 📊 RAM Free: ${formatBytes(os.freemem())}
║ 🟢 Process RAM: ${formatBytes(mem.rss)}
║ ⏱️  Sys Uptime: ${formatDuration(os.uptime() * 1000)}
║ ⏱️  Bot Uptime: ${formatDuration(process.uptime() * 1000)}
║ 📦 Sessions: ${getSessionCount()}/${config.maxSessions}
╚══════════════════════════╝`;
      await reply(sock, msg, text);
      break;
    }

    case 'getid': {
      await reply(sock, msg, `🆔 Chat ID:\n\`${from}\``);
      break;
    }

    case 'activegc': {
      const chats = await sock.groupFetchAllParticipating();
      await reply(sock, msg, `✅ Active groups: ${Object.keys(chats).length}`);
      break;
    }

    default:
      return null;
  }
}

module.exports = { ownerMenu };
