const { reply, randomChoice } = require('../lib/utils');
const axios = require('axios');

const animeQuotes = [
  '"L\'avenir appartient à ceux qui croient en leurs rêves." — Naruto Uzumaki',
  '"Les hommes ne pleurent pas pour les autres mais pour eux-mêmes." — Roronoa Zoro',
  '"Si tu ne risques pas ta vie, tu ne peux pas créer de futur." — Monkey D. Luffy',
  '"Le passé est le passé. On ne peut pas le changer. Mais on peut choisir comment vivre l\'avenir." — Levi Ackerman',
  '"Nul ne sait ce que l\'avenir leur réserve. C\'est pour cela que les possibilités sont infinies." — Edward Elric',
  '"Ne renonce jamais, peu importe ce qui arrive." — Izuku Midoriya',
  '"Le vrai courage c\'est de savoir être effrayé et d\'agir malgré tout." — Roy Mustang',
];

async function animeMenu(sock, msg, args, from, sender) {
  const cmd = args[0]?.toLowerCase();
  const query = args.slice(1).join(' ');

  switch (cmd) {
    case 'anime':
    case 'rechercheanime': {
      if (!query) return reply(sock, msg, '❌ Usage: !anime <titre>');
      try {
        const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
        const anime = res.data.data?.[0];
        if (!anime) return reply(sock, msg, `❌ Anime "${query}" introuvable.`);
        const text = `╔═══ 🎌 *ANIME INFO* ═══╗
║ 📌 Titre: ${anime.title}
║ 🗾 JP: ${anime.title_japanese || 'N/A'}
║ 📺 Type: ${anime.type || 'N/A'}
║ 🎬 Épisodes: ${anime.episodes || '?'}
║ ⭐ Score: ${anime.score || '?'}/10
║ 📊 Statut: ${anime.status || 'N/A'}
║ 📅 Diffusé: ${anime.aired?.string || 'N/A'}
║ 🏷️ Genres: ${anime.genres?.map(g => g.name).join(', ') || 'N/A'}
╚═══════════════════════════╝

📝 ${anime.synopsis?.slice(0, 300) || 'Aucune description.'}...`;
        if (anime.images?.jpg?.image_url) {
          await sock.sendMessage(from, { image: { url: anime.images.jpg.image_url }, caption: text }, { quoted: msg });
        } else {
          await reply(sock, msg, text);
        }
      } catch {
        await reply(sock, msg, `❌ Erreur lors de la recherche de l'anime.`);
      }
      break;
    }

    case 'manga': {
      if (!query) return reply(sock, msg, '❌ Usage: !manga <titre>');
      try {
        const res = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=1`);
        const manga = res.data.data?.[0];
        if (!manga) return reply(sock, msg, `❌ Manga "${query}" introuvable.`);
        const text = `╔═══ 📚 *MANGA INFO* ═══╗
║ 📌 Titre: ${manga.title}
║ 📚 Chapitres: ${manga.chapters || '?'}
║ 📖 Volumes: ${manga.volumes || '?'}
║ ⭐ Score: ${manga.score || '?'}/10
║ 📊 Statut: ${manga.status || 'N/A'}
║ 🏷️ Genres: ${manga.genres?.map(g => g.name).join(', ') || 'N/A'}
╚═══════════════════════════╝

📝 ${manga.synopsis?.slice(0, 300) || 'Aucune description.'}...`;
        if (manga.images?.jpg?.image_url) {
          await sock.sendMessage(from, { image: { url: manga.images.jpg.image_url }, caption: text }, { quoted: msg });
        } else {
          await reply(sock, msg, text);
        }
      } catch {
        await reply(sock, msg, `❌ Erreur lors de la recherche du manga.`);
      }
      break;
    }

    case 'waifu': {
      try {
        const res = await axios.get('https://api.waifu.pics/sfw/waifu');
        await sock.sendMessage(from, { image: { url: res.data.url }, caption: '😍 *WAIFU ALÉATOIRE*\n\n_Générée par DENTSU CRASH_' }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Impossible de récupérer une waifu. Réessaie !');
      }
      break;
    }

    case 'neko': {
      try {
        const res = await axios.get('https://api.waifu.pics/sfw/neko');
        await sock.sendMessage(from, { image: { url: res.data.url }, caption: '🐱 *NEKO ALÉATOIRE*\n\n_Générée par DENTSU CRASH_' }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Impossible de récupérer une neko.');
      }
      break;
    }

    case 'hug':
    case 'calin': {
      try {
        const res = await axios.get('https://api.waifu.pics/sfw/hug');
        await sock.sendMessage(from, { image: { url: res.data.url }, caption: '🤗 *CÂLIN !*\n\n_Généré par DENTSU CRASH_' }, { quoted: msg });
      } catch {
        await reply(sock, msg, '🤗 Câlin virtuel ! Je n\'ai pas pu charger le GIF, mais le câlin est réel ! ❤️');
      }
      break;
    }

    case 'kiss':
    case 'bisou': {
      try {
        const res = await axios.get('https://api.waifu.pics/sfw/kiss');
        await sock.sendMessage(from, { image: { url: res.data.url }, caption: '😘 *BISOU !*\n\n_Généré par DENTSU CRASH_' }, { quoted: msg });
      } catch {
        await reply(sock, msg, '😘 Bisou virtuel ! ❤️');
      }
      break;
    }

    case 'slap':
    case 'gifle': {
      try {
        const res = await axios.get('https://api.waifu.pics/sfw/slap');
        await sock.sendMessage(from, { image: { url: res.data.url }, caption: '👋 *CLAQUE !*\n\n_Généré par DENTSU CRASH_' }, { quoted: msg });
      } catch {
        await reply(sock, msg, '👋 Claque virtuelle ! 😤');
      }
      break;
    }

    case 'animequote':
    case 'citation_anime': {
      await reply(sock, msg, `🎌 *CITATION ANIME*\n\n${randomChoice(animeQuotes)}`);
      break;
    }

    case 'animepic':
    case 'animeimage': {
      try {
        const categories = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'];
        const cat = randomChoice(categories);
        const res = await axios.get(`https://api.waifu.pics/sfw/${cat}`);
        await sock.sendMessage(from, { image: { url: res.data.url }, caption: `🎌 *IMAGE ANIME — ${cat.toUpperCase()}*\n\n_Générée par DENTSU CRASH_` }, { quoted: msg });
      } catch {
        await reply(sock, msg, '❌ Impossible de charger l\'image anime.');
      }
      break;
    }

    case 'topanime': {
      try {
        const res = await axios.get('https://api.jikan.moe/v4/top/anime?limit=10');
        const animes = res.data.data;
        let text = `╔═══ 🏆 *TOP 10 ANIME* ═══╗\n`;
        animes.forEach((a, i) => {
          text += `║ ${i + 1}. ${a.title} ⭐${a.score}\n`;
        });
        text += `╚═══════════════════════════╝`;
        await reply(sock, msg, text);
      } catch {
        const topAnimes = ['1. Attack on Titan ⭐9.0', '2. Fullmetal Alchemist: Brotherhood ⭐9.1', '3. Steins;Gate ⭐9.1', '4. Hunter x Hunter ⭐9.0', '5. Vinland Saga ⭐8.7', '6. Death Note ⭐8.6', '7. Naruto Shippuden ⭐8.2', '8. One Piece ⭐8.7', '9. Demon Slayer ⭐8.7', '10. Jujutsu Kaisen ⭐8.7'];
        await reply(sock, msg, `╔═══ 🏆 *TOP 10 ANIME* ═══╗\n${topAnimes.map(a => `║ ${a}`).join('\n')}\n╚══════════════════════════╝`);
      }
      break;
    }

    case 'animenews':
    case 'actus_anime': {
      await reply(sock, msg, `📰 *ACTUS ANIME*\n\n🌐 Retrouve les dernières actus sur:\n• https://anime-sama.fr\n• https://crunchyroll.com\n• https://www.nautiljon.com`);
      break;
    }

    case 'animechar':
    case 'personnage': {
      if (!query) return reply(sock, msg, '❌ Usage: !animechar <nom du personnage>');
      try {
        const res = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`);
        const char = res.data.data?.[0];
        if (!char) return reply(sock, msg, `❌ Personnage "${query}" introuvable.`);
        const text = `╔═══ 🦸 *PERSONNAGE* ═══╗
║ 📌 Nom: ${char.name}
║ 🗾 JP: ${char.name_kanji || 'N/A'}
║ ❤️ Favoris: ${char.favorites?.toLocaleString() || '?'}
╚════════════════════════╝

📝 ${char.about?.slice(0, 300) || 'Aucune description.'}...`;
        if (char.images?.jpg?.image_url) {
          await sock.sendMessage(from, { image: { url: char.images.jpg.image_url }, caption: text }, { quoted: msg });
        } else {
          await reply(sock, msg, text);
        }
      } catch {
        await reply(sock, msg, '❌ Erreur lors de la recherche du personnage.');
      }
      break;
    }

    default:
      return null;
  }
}

module.exports = { animeMenu };
