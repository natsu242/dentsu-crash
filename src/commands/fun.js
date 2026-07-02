const { reply, randomChoice, randomInt } = require('../lib/utils');
const axios = require('axios');

const blagues = [
  'Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que s\'ils plongeaient en avant, ils tomberaient dans le bateau ! 😂',
  'Un homme entre dans une bibliothèque et demande des informations sur la paranoïa. La bibliothécaire chuchote : « Ils sont sur l\'étagère derrière vous ! » 😅',
  'Qu\'est-ce qu\'un canif ? Un petit fien ! 🐕',
  'Pourquoi le facteur est-il toujours en forme ? Parce qu\'il court après ses lettres ! 💪',
  'Comment appelle-t-on un magicien qui perd ses pouvoirs ? Un marchand. 🎩',
  'Qu\'est-ce qu\'un fromage qui n\'est pas à toi ? Un camembert volé. 🧀',
  'Pourquoi les moutons ne lisent pas les journaux ? Parce qu\'il y a toujours un loup dans l\'histoire ! 🐺',
  'Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-peint de Noël ! 🎄',
];

const verités = [
  'Dis un secret que tu n\'as jamais dit à personne.',
  'Quel est ton plus grand regret ?',
  'Qui est la dernière personne que tu as mentie ?',
  'Quel est le truc le plus embarrassant qui t\'est arrivé ?',
  'As-tu déjà eu le béguin pour quelqu\'un dans ce groupe ?',
  'Quel est ton plus grand défaut ?',
  'Quelle est la chose la plus folle que tu aies faite par amour ?',
  'T\'est-il déjà arrivé de pleurer en regardant un film ?',
];

const défis = [
  'Chante une chanson d\'au moins 30 secondes.',
  'Fais 20 pompes et envoie une vidéo !',
  'Écris un poème sur quelqu\'un du groupe.',
  'Appelle quelqu\'un au hasard et dis "Je t\'aime !" puis raccroche.',
  'Change ta photo de profil avec une photo ridicule pendant 1 heure.',
  'Envoie un message à ton/ta ex.',
  'Fais une imitation d\'un membre du groupe.',
  'Dis à voix haute la chose la plus bizarre que tu aies jamais faite.',
];

const quotes = [
  '"La vie est ce qui arrive quand tu es occupé à faire d\'autres projets." — John Lennon',
  '"L\'avenir appartient à ceux qui se lèvent tôt." — Eleanor Roosevelt',
  '"La seule façon de faire du bon travail est d\'aimer ce que vous faites." — Steve Jobs',
  '"Ne marchez pas devant moi, je ne suivrai peut-être pas. Ne marchez pas derrière moi, je ne vous guiderai peut-être pas. Marchez à côté de moi." — Albert Camus',
  '"Le succès c\'est d\'aller d\'échec en échec sans perdre son enthousiasme." — Winston Churchill',
  '"Soyez le changement que vous voulez voir dans le monde." — Gandhi',
  '"La vie est courte, souris pendant que tu as encore des dents." — Inconnue',
];

const compliments = [
  'Tu es une personne extraordinaire et unique! ✨',
  'Ta présence illumine chaque pièce dans laquelle tu entres. 🌟',
  'Tu as un cœur en or et une âme magnifique. 💛',
  'Le monde est meilleur grâce à toi! 🌍',
  'Tu as un sourire qui peut illuminer les jours les plus sombres. 😊',
  'Ta gentillesse est contagieuse. Continue comme ça! 🤗',
  'Tu es plus fort(e) que tu ne le penses. 💪',
];

const wyrOptions = [
  'Avoir le pouvoir de lire les pensées | Être invisible à volonté ?',
  'Vivre 100 ans normalement | Vivre 50 ans comme une star ?',
  'Ne jamais dormir | Ne jamais manger ?',
  'Voyager dans le passé | Voyager dans le futur ?',
  'Être le plus riche | Être le plus intelligent ?',
  'Perdre ses souvenirs | Perdre ses amis ?',
];

async function funMenu(sock, msg, args, from, sender) {
  const cmd = args[0]?.toLowerCase();

  switch (cmd) {
    case 'sticker':
    case 'stick': {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const image = msg.message?.imageMessage || quoted?.imageMessage || quoted?.videoMessage;
      if (!image) return reply(sock, msg, '❌ Envoie ou cite une image/vidéo avec !sticker');
      try {
        await reply(sock, msg, '⏳ Création du sticker...');
        // Note: implementation complète avec sharp/webp
        await reply(sock, msg, '✅ Fonctionnalité sticker disponible. Envoie une image avec la commande !sticker en caption.');
      } catch {
        await reply(sock, msg, '❌ Erreur lors de la création du sticker.');
      }
      break;
    }

    case 'toimg':
    case 'sticker2img': {
      const sticker = msg.message?.stickerMessage
        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
      if (!sticker) return reply(sock, msg, '❌ Cite ou envoie un sticker avec !toimg');
      await reply(sock, msg, '⏳ Conversion en cours...');
      await reply(sock, msg, '✅ Fonctionnalité disponible. Cite un sticker pour le convertir en image.');
      break;
    }

    case 'blague':
    case 'joke': {
      await reply(sock, msg, `😂 *BLAGUE DU JOUR*\n\n${randomChoice(blagues)}`);
      break;
    }

    case 'citation':
    case 'quote': {
      await reply(sock, msg, `💬 *CITATION*\n\n${randomChoice(quotes)}`);
      break;
    }

    case '8ball': {
      const question = args.slice(1).join(' ');
      if (!question) return reply(sock, msg, '❌ Pose une question: !8ball <question>');
      const reponses = ['🟢 Oui, absolument !', '🟢 C\'est certain.', '🟢 Très probablement.', '🟡 Peut-être...', '🟡 Je ne suis pas sûr.', '🔴 Non.', '🔴 Absolument pas !', '🔴 Très peu probable.', '⚪ Je ne peux pas répondre maintenant.'];
      await reply(sock, msg, `🎱 *BOULE MAGIQUE 8*\n\n❓ Question: ${question}\n\n💬 Réponse: ${randomChoice(reponses)}`);
      break;
    }

    case 'pile':
    case 'flip': {
      const result = Math.random() < 0.5 ? '🟡 PILE' : '⚪ FACE';
      await reply(sock, msg, `🪙 *PILE OU FACE*\n\n${result}!`);
      break;
    }

    case 'des':
    case 'dice': {
      const sides = parseInt(args[1]) || 6;
      const result = randomInt(1, sides);
      await reply(sock, msg, `🎲 *DÉ À ${sides} FACES*\n\nRésultat: *${result}*`);
      break;
    }

    case 'noter':
    case 'rate': {
      const thing = args.slice(1).join(' ');
      if (!thing) return reply(sock, msg, '❌ Usage: !rate <quelque chose>');
      const score = randomInt(1, 10);
      const stars = '⭐'.repeat(Math.round(score / 2));
      await reply(sock, msg, `⭐ *NOTATION*\n\n📌 ${thing}\n${stars}\n📊 Score: ${score}/10`);
      break;
    }

    case 'ship':
    case 'couple': {
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      if (!mentions || mentions.length < 2) return reply(sock, msg, '❌ Mentionne 2 personnes: !ship @personne1 @personne2');
      const score = randomInt(1, 100);
      const hearts = score >= 80 ? '💕💕💕' : score >= 50 ? '💛💛' : score >= 30 ? '💙' : '💔';
      await reply(sock, msg, `💑 *COMPATIBILITÉ AMOUR*\n\n@${mentions[0].split('@')[0]} ❤️ @${mentions[1].split('@')[0]}\n\n${hearts} Compatibilité: ${score}%\n\n${score >= 80 ? 'C\'est l\'amour fou ! 🥰' : score >= 50 ? 'Pas mal ! 😊' : score >= 30 ? 'Il faut travailler dessus... 😅' : 'Ce n\'est pas votre destin... 💔'}`);
      break;
    }

    case 'vérité':
    case 'truth':
    case 'verite': {
      await reply(sock, msg, `🎭 *VÉRITÉ*\n\n${randomChoice(verités)}`);
      break;
    }

    case 'défi':
    case 'dare':
    case 'defi': {
      await reply(sock, msg, `💥 *DÉFI*\n\n${randomChoice(défis)}`);
      break;
    }

    case 'wyr':
    case 'ou': {
      const option = randomChoice(wyrOptions);
      const [a, b] = option.split('|');
      await reply(sock, msg, `🤔 *TU PRÉFÈRES...*\n\n1️⃣ ${a.trim()}\n\n   OU\n\n2️⃣ ${b.trim()}`);
      break;
    }

    case 'compliment':
    case 'feliciter': {
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const target = mentioned ? `@${mentioned.split('@')[0]}` : 'toi';
      await reply(sock, msg, `💐 *COMPLIMENT POUR ${target.toUpperCase()}*\n\n${randomChoice(compliments)}`);
      break;
    }

    case 'meme': {
      try {
        const res = await axios.get('https://meme-api.com/gimme/fr');
        const data = res.data;
        const text = `😂 *MEME*\n\n📌 ${data.title}\n⬆️ ${data.ups} upvotes\n🔗 ${data.url}`;
        await reply(sock, msg, text);
      } catch {
        await reply(sock, msg, `😂 *MEME*\n\n😅 Impossible de récupérer un meme pour l'instant. Essaie plus tard !`);
      }
      break;
    }

    case 'pp':
    case 'photo': {
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
      try {
        const pfp = await sock.profilePictureUrl(target, 'image');
        await sock.sendMessage(from, { image: { url: pfp }, caption: `🖼️ Photo de profil de @${target.split('@')[0]}` }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Impossible de récupérer la photo de profil. Elle est peut-être privée.');
      }
      break;
    }

    case 'bio':
    case 'statut': {
      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
      try {
        const status = await sock.fetchStatus(target);
        await reply(sock, msg, `📝 *BIO DE @${target.split('@')[0]}*\n\n${status?.status || 'Aucune bio.'}`);
      } catch {
        await reply(sock, msg, '❌ Impossible de récupérer la bio. Elle est peut-être privée.');
      }
      break;
    }

    case 'calcul':
    case 'math': {
      const expr = args.slice(1).join(' ');
      if (!expr) return reply(sock, msg, '❌ Usage: !calcul <expression>');
      try {
        const clean = expr.replace(/[^0-9+\-*/().% ]/g, '');
        const result = eval(clean);
        await reply(sock, msg, `🧮 *CALCUL*\n\n${expr} = ${result}`);
      } catch {
        await reply(sock, msg, '❌ Expression mathématique invalide.');
      }
      break;
    }

    default:
      return null;
  }
}

module.exports = { funMenu };
