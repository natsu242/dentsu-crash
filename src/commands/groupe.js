const { reply, isAdmin, isBotAdmin, formatJid } = require('../lib/utils');
const config = require('../config');

async function groupeMenu(sock, msg, args, from, sender) {
  const isGroup    = from.endsWith('@g.us');
  const botAdmin   = isGroup ? await isBotAdmin(sock, from) : false;
  const senderAdmin = isGroup ? await isAdmin(sock, from, sender) : false;

  const cmd = args[0]?.toLowerCase();

  switch (cmd) {

    case 'tagall': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      const meta    = await sock.groupMetadata(from);
      const members = meta.participants;
      let text = `╔═══ 📢 *TAG ALL* ═══╗\n║ 👥 ${members.length} members\n╚═══════════════════╝\n\n`;
      const mentions = members.map(m => m.id);
      members.forEach(m => { text += `@${formatJid(m.id)}\n`; });
      await sock.sendMessage(from, { text, mentions }, { quoted: msg });
      break;
    }

    case 'hidetag': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      const meta     = await sock.groupMetadata(from);
      const mentions = meta.participants.map(m => m.id);
      const text     = args.slice(1).join(' ') || '📢 Group message';
      await sock.sendMessage(from, { text, mentions }, { quoted: msg });
      break;
    }

    case 'kick': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      if (!botAdmin)    return reply(sock, msg, '❌ I need to be an admin to kick members.');
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || (args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply(sock, msg, '❌ Mention the member to kick.');
      await sock.groupParticipantsUpdate(from, [target], 'remove');
      await reply(sock, msg, `✅ @${formatJid(target)} has been kicked.`);
      break;
    }

    case 'add': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      if (!botAdmin)    return reply(sock, msg, '❌ I need to be an admin to add members.');
      const num = args[1]?.replace(/[^0-9]/g, '');
      if (!num) return reply(sock, msg, '❌ Usage: .add <number>');
      const jid = num + '@s.whatsapp.net';
      await sock.groupParticipantsUpdate(from, [jid], 'add');
      await reply(sock, msg, `✅ +${num} has been added to the group.`);
      break;
    }

    case 'promote':
    case 'admin': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      if (!botAdmin)    return reply(sock, msg, '❌ I need to be an admin to promote members.');
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return reply(sock, msg, '❌ Mention the member to promote.');
      await sock.groupParticipantsUpdate(from, [target], 'promote');
      await reply(sock, msg, `✅ @${formatJid(target)} is now an admin.`);
      break;
    }

    case 'demote': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      if (!botAdmin)    return reply(sock, msg, '❌ I need to be an admin to demote members.');
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return reply(sock, msg, '❌ Mention the member to demote.');
      await sock.groupParticipantsUpdate(from, [target], 'demote');
      await reply(sock, msg, `✅ @${formatJid(target)} is no longer an admin.`);
      break;
    }

    case 'mute': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      if (!botAdmin)    return reply(sock, msg, '❌ I need to be an admin to mute the group.');
      await sock.groupSettingUpdate(from, 'announcement');
      await reply(sock, msg, '🔇 Group is now read-only. Only admins can send messages.');
      break;
    }

    case 'unmute': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      if (!botAdmin)    return reply(sock, msg, '❌ I need to be an admin to unmute the group.');
      await sock.groupSettingUpdate(from, 'not_announcement');
      await reply(sock, msg, '🔊 Group is now open. Everyone can send messages.');
      break;
    }

    case 'link': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      const code = await sock.groupInviteCode(from);
      await reply(sock, msg, `🔗 Group invite link:\nhttps://chat.whatsapp.com/${code}`);
      break;
    }

    case 'revoke': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      if (!botAdmin)    return reply(sock, msg, '❌ I need to be an admin to reset the link.');
      await sock.groupRevokeInvite(from);
      await reply(sock, msg, '✅ Group invite link has been reset.');
      break;
    }

    case 'setname': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      if (!botAdmin)    return reply(sock, msg, '❌ I need to be an admin to change the name.');
      const name = args.slice(1).join(' ');
      if (!name) return reply(sock, msg, '❌ Usage: .setname <name>');
      await sock.groupUpdateSubject(from, name);
      await reply(sock, msg, `✅ Group name changed to: ${name}`);
      break;
    }

    case 'setdesc': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      if (!botAdmin)    return reply(sock, msg, '❌ I need to be an admin to change the description.');
      const desc = args.slice(1).join(' ');
      if (!desc) return reply(sock, msg, '❌ Usage: .setdesc <description>');
      await sock.groupUpdateDescription(from, desc);
      await reply(sock, msg, '✅ Group description updated.');
      break;
    }

    case 'info':
    case 'infosgroupe': {
      if (!isGroup) return reply(sock, msg, '❌ This command only works in groups.');
      const meta   = await sock.groupMetadata(from);
      const admins = meta.participants.filter(p => p.admin).length;
      const text   = `╔═══ 📋 *GROUP INFO* ═══╗
║ 🏷️  Name: ${meta.subject}
║ 👥 Members: ${meta.participants.length}
║ 👑 Admins: ${admins}
║ 📝 Desc: ${meta.desc || 'None'}
║ 🆔 ID: ${meta.id}
║ 📅 Created: ${new Date(meta.creation * 1000).toLocaleDateString('en-GB')}
╚════════════════════════╝`;
      await reply(sock, msg, text);
      break;
    }

    case 'antilink': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      await reply(sock, msg, '🛡️ Anti-link protection enabled. Any WhatsApp link posted by a non-admin will be deleted.');
      break;
    }

    case 'ban': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      if (!botAdmin)    return reply(sock, msg, '❌ I need to be an admin to ban members.');
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return reply(sock, msg, '❌ Mention the member to ban.');
      await sock.groupParticipantsUpdate(from, [target], 'remove');
      await reply(sock, msg, `🚫 @${formatJid(target)} has been banned from the group.`);
      break;
    }

    case 'welcome': {
      if (!isGroup)     return reply(sock, msg, '❌ This command only works in groups.');
      if (!senderAdmin) return reply(sock, msg, '❌ Only group admins can use this.');
      const welcomeMsg = args.slice(1).join(' ') || '👋 Welcome to the group!';
      await reply(sock, msg, `✅ Welcome message set:\n${welcomeMsg}`);
      break;
    }

    case 'poll':
    case 'sondage': {
      if (!isGroup) return reply(sock, msg, '❌ This command only works in groups.');
      const parts = args.slice(1).join(' ').split('|');
      if (parts.length < 3) return reply(sock, msg, '❌ Usage: .poll Question | Option1 | Option2');
      const question = parts[0].trim();
      const options  = parts.slice(1).map(o => o.trim());
      await sock.sendMessage(from, {
        poll: { name: question, values: options, selectableCount: 1 },
      });
      break;
    }

    default:
      return null;
  }
}

module.exports = { groupeMenu };
