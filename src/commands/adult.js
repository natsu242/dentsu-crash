const { reply } = require('../lib/utils');
const axios = require('axios');

// ⚠️ MENU ADULTE — RÉSERVÉ AUX MAJEURS (18+)
// Les contenus NSFW sont récupérés depuis des APIs publiques dédiées adultes.

async function adultMenu(sock, msg, args, from, sender) {
  const cmd = args[0]?.toLowerCase();

  // Vérification groupe: l'admin doit avoir activé le mode adulte
  // Par défaut désactivé, à activer via !adult on (owner only)

  switch (cmd) {
    case 'hentai': {
      try {
        const res = await axios.get('https://api.waifu.pics/nsfw/waifu');
        await sock.sendMessage(from, {
          image: { url: res.data.url },
          caption: '🔞 *HENTAI*\n\n⚠️ Contenu réservé aux +18',
        }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Impossible de récupérer le contenu. Réessaie !');
      }
      break;
    }

    case 'nsfwwaifu':
    case 'nsfw_waifu': {
      try {
        const res = await axios.get('https://api.waifu.pics/nsfw/waifu');
        await sock.sendMessage(from, {
          image: { url: res.data.url },
          caption: '🔞 *NSFW WAIFU*\n\n⚠️ Contenu réservé aux +18',
        }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Erreur lors de la récupération.');
      }
      break;
    }

    case 'nsfwneko':
    case 'nsfw_neko': {
      try {
        const res = await axios.get('https://api.waifu.pics/nsfw/neko');
        await sock.sendMessage(from, {
          image: { url: res.data.url },
          caption: '🔞 *NSFW NEKO*\n\n⚠️ Contenu réservé aux +18',
        }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Erreur lors de la récupération.');
      }
      break;
    }

    case 'trap': {
      try {
        const res = await axios.get('https://api.waifu.pics/nsfw/trap');
        await sock.sendMessage(from, {
          image: { url: res.data.url },
          caption: '🔞 *TRAP*\n\n⚠️ Contenu réservé aux +18',
        }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Erreur lors de la récupération.');
      }
      break;
    }

    case 'blowjob':
    case 'bj_nsfw': {
      try {
        const res = await axios.get('https://api.waifu.pics/nsfw/blowjob');
        await sock.sendMessage(from, {
          image: { url: res.data.url },
          caption: '🔞 *CONTENU ADULTE*\n\n⚠️ Réservé aux +18',
        }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Erreur lors de la récupération.');
      }
      break;
    }

    case 'nsfwgif': {
      try {
        const categories = ['ero', 'hentai', 'neko', 'waifu'];
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const res = await axios.get(`https://api.waifu.pics/nsfw/${cat}`);
        await sock.sendMessage(from, {
          image: { url: res.data.url },
          caption: `🔞 *GIF ADULTE — ${cat.toUpperCase()}*\n\n⚠️ Contenu réservé aux +18`,
        }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Impossible de charger le contenu.');
      }
      break;
    }

    case 'ero': {
      try {
        const res = await axios.get('https://api.waifu.pics/nsfw/ero');
        await sock.sendMessage(from, {
          image: { url: res.data.url },
          caption: '🔞 *ERO*\n\n⚠️ Contenu réservé aux +18',
        }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Erreur.');
      }
      break;
    }

    case 'punch_nsfw':
    case 'random_nsfw': {
      const types = ['hentai', 'ero', 'neko', 'waifu', 'trap', 'blowjob'];
      const type = types[Math.floor(Math.random() * types.length)];
      try {
        const res = await axios.get(`https://api.waifu.pics/nsfw/${type}`);
        await sock.sendMessage(from, {
          image: { url: res.data.url },
          caption: `🔞 *RANDOM NSFW — ${type.toUpperCase()}*\n\n⚠️ Contenu réservé aux +18`,
        }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Erreur.');
      }
      break;
    }

    case 'cum': {
      try {
        const res = await axios.get('https://api.waifu.pics/nsfw/cum');
        await sock.sendMessage(from, {
          image: { url: res.data.url },
          caption: '🔞 *CONTENU ADULTE*\n\n⚠️ Réservé aux +18',
        }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Erreur.');
      }
      break;
    }

    case 'nsfwhelp':
    case 'adultmenu': {
      const text = `╔═══ 🔞 *ADULT MENU (+18)* ═══╗
║ ⚠️ ACCÈS RÉSERVÉ AUX MAJEURS
╠══════════════════════════╣
║ !hentai — Image hentai
║ !nsfw_waifu — Waifu NSFW
║ !nsfw_neko — Neko NSFW
║ !trap — Trap NSFW
║ !ero — Contenu érotique
║ !nsfwgif — GIF NSFW aléatoire
║ !random_nsfw — Contenu aléatoire
╚══════════════════════════╝
⚠️ Contenu strictement réservé aux adultes.
L'owner n'est pas responsable de l'utilisation.`;
      await reply(sock, msg, text);
      break;
    }

    default:
      return null;
  }
}

module.exports = { adultMenu };
