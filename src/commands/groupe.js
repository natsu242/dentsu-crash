const { reply, isAdmin, isBotAdmin, formatJid } = require('../lib/utils');
const config = require('../config');

async function groupeMenu(sock, msg, args, from, sender) {
  const isGroup = from.endsWith('@g.us');
  const botAdmin = isGroup ? await isBotAdmin(sock, from) : false;
  const senderAdmin = isGroup ? await isAdmin(sock, from, sender) : false;

  const cmd = args[0]?.toLowerCase();

  switch (cmd) {
    // ───────────────────────────────────────────
    case 'tagall':
    case 'tousmentionner': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      const meta = await sock.groupMetadata(from);
      const members = meta.participants;
      let text = `╔═══ 📢 *TAG ALL* ═══╗\n`;
      text += `║ 👥 ${members.length} membres\n╚═══════════════════╝\n\n`;
      const mentions = members.map((m) => m.id);
      members.forEach((m) => { text += `@${formatJid(m.id)}\n`; });
      await sock.sendMessage(from, { text, mentions }, { quoted: msg });
      break;
    }

    case 'hidetag':
    case 'taginvisible': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      const meta = await sock.groupMetadata(from);
      const mentions = meta.participants.map((m) => m.id);
      const text = args.slice(1).join(' ') || '📢 Message du groupe';
      await sock.sendMessage(from, { text, mentions }, { quoted: msg });
      break;
    }

    case 'kick':
    case 'expulser': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      if (!botAdmin) return reply(sock, msg, '❌ Je dois être admin pour expulser.');
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        || (args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
      if (!target) return reply(sock, msg, '❌ Mentionne le membre à expulser.');
      await sock.groupParticipantsUpdate(from, [target], 'remove');
      await reply(sock, msg, `✅ @${formatJid(target)} a été expulsé.`);
      break;
    }

    case 'add':
    case 'ajouter': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      if (!botAdmin) return reply(sock, msg, '❌ Je dois être admin pour ajouter.');
      const num = args[1]?.replace(/[^0-9]/g, '');
      if (!num) return reply(sock, msg, '❌ Usage: !add <numéro>');
      const jid = num + '@s.whatsapp.net';
      await sock.groupParticipantsUpdate(from, [jid], 'add');
      await reply(sock, msg, `✅ ${num} a été ajouté au groupe.`);
      break;
    }

    case 'promote':
    case 'admin': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      if (!botAdmin) return reply(sock, msg, '❌ Je dois être admin.');
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return reply(sock, msg, '❌ Mentionne le membre à promouvoir.');
      await sock.groupParticipantsUpdate(from, [target], 'promote');
      await reply(sock, msg, `✅ @${formatJid(target)} est maintenant admin.`);
      break;
    }

    case 'demote':
    case 'retrogader': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      if (!botAdmin) return reply(sock, msg, '❌ Je dois être admin.');
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return reply(sock, msg, '❌ Mentionne le membre à rétrograder.');
      await sock.groupParticipantsUpdate(from, [target], 'demote');
      await reply(sock, msg, `✅ @${formatJid(target)} n'est plus admin.`);
      break;
    }

    case 'mute':
    case 'fermer': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      if (!botAdmin) return reply(sock, msg, '❌ Je dois être admin.');
      await sock.groupSettingUpdate(from, 'announcement');
      await reply(sock, msg, '🔇 Groupe en lecture seule. Seuls les admins peuvent écrire.');
      break;
    }

    case 'unmute':
    case 'ouvrir': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      if (!botAdmin) return reply(sock, msg, '❌ Je dois être admin.');
      await sock.groupSettingUpdate(from, 'not_announcement');
      await reply(sock, msg, '🔊 Groupe ouvert. Tout le monde peut écrire.');
      break;
    }

    case 'link':
    case 'lien': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      const code = await sock.groupInviteCode(from);
      await reply(sock, msg, `🔗 Lien du groupe:\nhttps://chat.whatsapp.com/${code}`);
      break;
    }

    case 'revoke':
    case 'reinitialiser': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      if (!botAdmin) return reply(sock, msg, '❌ Je dois être admin.');
      await sock.groupRevokeInvite(from);
      await reply(sock, msg, '✅ Lien du groupe réinitialisé avec succès.');
      break;
    }

    case 'setname':
    case 'nomdgroupe': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      if (!botAdmin) return reply(sock, msg, '❌ Je dois être admin.');
      const name = args.slice(1).join(' ');
      if (!name) return reply(sock, msg, '❌ Usage: !setname <nom>');
      await sock.groupUpdateSubject(from, name);
      await reply(sock, msg, `✅ Nom du groupe changé en: ${name}`);
      break;
    }

    case 'setdesc':
    case 'description': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      if (!botAdmin) return reply(sock, msg, '❌ Je dois être admin.');
      const desc = args.slice(1).join(' ');
      if (!desc) return reply(sock, msg, '❌ Usage: !setdesc <description>');
      await sock.groupUpdateDescription(from, desc);
      await reply(sock, msg, '✅ Description du groupe mise à jour.');
      break;
    }

    case 'info':
    case 'infosgroupe': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      const meta = await sock.groupMetadata(from);
      const admins = meta.participants.filter((p) => p.admin).length;
      const text = `╔═══ 📋 *INFO GROUPE* ═══╗
║ 🏷️ Nom: ${meta.subject}
║ 👥 Membres: ${meta.participants.length}
║ 👑 Admins: ${admins}
║ 📝 Desc: ${meta.desc || 'Aucune'}
║ 🆔 ID: ${meta.id}
║ 📅 Créé: ${new Date(meta.creation * 1000).toLocaleDateString('fr-FR')}
╚══════════════════════════╝`;
      await reply(sock, msg, text);
      break;
    }

    case 'antilink': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      await reply(sock, msg, '🛡️ Protection anti-lien activée. Tout lien WhatsApp posté par un non-admin sera supprimé.');
      break;
    }

    case 'ban':
    case 'bannir': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      if (!botAdmin) return reply(sock, msg, '❌ Je dois être admin.');
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return reply(sock, msg, '❌ Mentionne le membre à bannir.');
      await sock.groupParticipantsUpdate(from, [target], 'remove');
      await reply(sock, msg, `🚫 @${formatJid(target)} a été banni du groupe.`);
      break;
    }

    case 'welcome':
    case 'bienvenue': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      if (!senderAdmin) return reply(sock, msg, '❌ Réservé aux admins.');
      const msg2 = args.slice(1).join(' ') || '👋 Bienvenue dans le groupe !';
      await reply(sock, msg, `✅ Message de bienvenue défini:\n${msg2}`);
      break;
    }

    case 'poll':
    case 'sondage': {
      if (!isGroup) return reply(sock, msg, '❌ Commande réservée aux groupes.');
      const parts = args.slice(1).join(' ').split('|');
      if (parts.length < 3) return reply(sock, msg, '❌ Usage: !poll Question | Option1 | Option2');
      const question = parts[0].trim();
      const options = parts.slice(1).map((o) => ({ optionName: o.trim() }));
      await sock.sendMessage(from, {
        poll: { name: question, values: options.map((o) => o.optionName), selectableCount: 1 },
      });
      break;
    }

    default:
      return null; // Commande non gérée ici
  }
}

module.exports = { groupeMenu };
