const { reply, isOwner } = require('../lib/utils');

// ─── Bug report storage (in-memory, resets on restart) ────────────────────────
const bugReports = [];
let bugIdCounter = 1;

async function bugMenu(sock, msg, args, from, sender) {
  const command = args[0]?.toLowerCase();

  switch (command) {

    // ── .bugreport <description> ─────────────────────────────────────────────
    case 'bugreport':
    case 'report': {
      const description = args.slice(1).join(' ').trim();
      if (!description) {
        return reply(sock, msg,
          '🐛 *BUG REPORT*\n\nUsage: `.bugreport <description>`\n\nExample:\n`.bugreport Bot crashes when I use .yt command`'
        );
      }

      const id = `BUG-${String(bugIdCounter++).padStart(4, '0')}`;
      const reporter = sender.split('@')[0];
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

      bugReports.push({ id, reporter, description, timestamp, status: 'open' });

      // Notify owner
      try {
        const ownerJid = require('../config').ownerNumber + '@s.whatsapp.net';
        await sock.sendMessage(ownerJid, {
          text: `🚨 *NEW BUG REPORT*\n\n🆔 ID: ${id}\n👤 Reporter: +${reporter}\n📝 Description: ${description}\n🕐 Time: ${timestamp}`,
        });
      } catch (_) {}

      return reply(sock, msg,
        `✅ *Bug Report Submitted!*\n\n🆔 Report ID: *${id}*\n📝 Description: ${description}\n\n_Your report has been sent to the owner. Thank you!_`
      );
    }

    // ── .buglist ─────────────────────────────────────────────────────────────
    case 'buglist':
    case 'bugs': {
      if (!isOwner(sender)) {
        return reply(sock, msg, '❌ This command is for the bot owner only.');
      }

      if (bugReports.length === 0) {
        return reply(sock, msg, '✅ *Bug List*\n\nNo bug reports yet. The bot is running clean! 🎉');
      }

      const open = bugReports.filter(b => b.status === 'open');
      const fixed = bugReports.filter(b => b.status === 'fixed');

      let text = `🐛 *BUG REPORTS — ${bugReports.length} total*\n`;
      text += `🔴 Open: ${open.length} | ✅ Fixed: ${fixed.length}\n`;
      text += `${'─'.repeat(32)}\n`;

      open.slice(-10).forEach(b => {
        text += `\n🔴 *${b.id}*\n`;
        text += `   👤 +${b.reporter}\n`;
        text += `   📝 ${b.description.slice(0, 80)}${b.description.length > 80 ? '...' : ''}\n`;
        text += `   🕐 ${b.timestamp}\n`;
      });

      if (open.length === 0) text += '\n_No open bugs_';

      return reply(sock, msg, text.trim());
    }

    // ── .bugfix <ID> ─────────────────────────────────────────────────────────
    case 'bugfix':
    case 'fixbug': {
      if (!isOwner(sender)) {
        return reply(sock, msg, '❌ This command is for the bot owner only.');
      }

      const bugId = args[1]?.toUpperCase();
      if (!bugId) {
        return reply(sock, msg, '❌ Usage: `.bugfix <ID>`\nExample: `.bugfix BUG-0001`');
      }

      const bug = bugReports.find(b => b.id === bugId);
      if (!bug) {
        return reply(sock, msg, `❌ Bug *${bugId}* not found.\n\nUse *.buglist* to see all reports.`);
      }
      if (bug.status === 'fixed') {
        return reply(sock, msg, `✅ Bug *${bugId}* is already marked as fixed.`);
      }

      bug.status = 'fixed';
      bug.fixedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

      // Notify reporter
      try {
        await sock.sendMessage(bug.reporter + '@s.whatsapp.net', {
          text: `✅ *Bug Fixed!*\n\n🆔 Your report *${bugId}* has been resolved.\n📝 Issue: ${bug.description}\n\nThank you for reporting! — ${require('../config').botName}`,
        });
      } catch (_) {}

      return reply(sock, msg,
        `✅ *Bug Marked as Fixed!*\n\n🆔 ID: ${bugId}\n📝 ${bug.description}\n👤 Reporter notified.`
      );
    }

    // ── .debug ───────────────────────────────────────────────────────────────
    case 'debug':
    case 'diagnostics': {
      if (!isOwner(sender)) {
        return reply(sock, msg, '❌ This command is for the bot owner only.');
      }

      const memUsage = process.memoryUsage();
      const uptimeSec = Math.floor(process.uptime());
      const uptimeMin = Math.floor(uptimeSec / 60);
      const uptimeHr  = Math.floor(uptimeMin / 60);

      const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(1);

      const { getSessionCount } = require('../lib/session-manager');

      const text = `🔧 *DIAGNOSTICS REPORT*
${'─'.repeat(30)}
🤖 *Bot*
  • Name: ${require('../config').botName} v${require('../config').version}
  • Uptime: ${uptimeHr}h ${uptimeMin % 60}m ${uptimeSec % 60}s
  • Node.js: ${process.version}
  • Platform: ${process.platform}

📊 *Memory*
  • RSS:  ${toMB(memUsage.rss)} MB
  • Heap: ${toMB(memUsage.heapUsed)} / ${toMB(memUsage.heapTotal)} MB
  • Ext:  ${toMB(memUsage.external)} MB

📱 *Sessions*
  • Active: ${getSessionCount()} / ${require('../config').maxSessions}

🐛 *Bug Reports*
  • Total: ${bugReports.length}
  • Open:  ${bugReports.filter(b => b.status === 'open').length}
  • Fixed: ${bugReports.filter(b => b.status === 'fixed').length}

⚡ *Status*: Bot is running normally ✅`;

      return reply(sock, msg, text);
    }

    default:
      return null;
  }
}

module.exports = { bugMenu };
