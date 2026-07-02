const { reply } = require('../lib/utils');
const axios = require('axios');
const ytSearch = require('yt-search');

async function downloadMenu(sock, msg, args, from, sender) {
  const cmd = args[0]?.toLowerCase();

  switch (cmd) {
    case 'yt':
    case 'youtube':
    case 'ytmp4': {
      const query = args.slice(1).join(' ');
      if (!query) return reply(sock, msg, '❌ Usage: !yt <titre ou lien>');
      try {
        await reply(sock, msg, '⏳ Recherche en cours...');
        const results = await ytSearch(query);
        const video = results.videos?.[0];
        if (!video) return reply(sock, msg, '❌ Aucun résultat trouvé.');
        const text = `╔═══ 🎬 *YOUTUBE* ═══╗
║ 📌 Titre: ${video.title}
║ ⏱️ Durée: ${video.timestamp}
║ 👁️ Vues: ${video.views?.toLocaleString()}
║ 👤 Chaîne: ${video.author?.name}
║ 🔗 Lien: ${video.url}
╚════════════════════╝

📥 Télécharge via: https://ssyoutube.com/watch?v=${video.videoId}`;
        await reply(sock, msg, text);
      } catch (err) {
        await reply(sock, msg, `❌ Erreur: ${err.message}`);
      }
      break;
    }

    case 'ytmp3':
    case 'music': {
      const query = args.slice(1).join(' ');
      if (!query) return reply(sock, msg, '❌ Usage: !ytmp3 <titre ou lien>');
      try {
        await reply(sock, msg, '⏳ Recherche de la musique...');
        const results = await ytSearch(query);
        const video = results.videos?.[0];
        if (!video) return reply(sock, msg, '❌ Aucun résultat trouvé.');
        const text = `╔═══ 🎵 *MUSIQUE* ═══╗
║ 🎤 Titre: ${video.title}
║ ⏱️ Durée: ${video.timestamp}
║ 👤 Artiste: ${video.author?.name}
║ 🔗 Lien: ${video.url}
╚════════════════════╝

📥 Télécharge MP3 via: https://cnvmp3.com/v12/?url=${encodeURIComponent(video.url)}`;
        await reply(sock, msg, text);
      } catch (err) {
        await reply(sock, msg, `❌ Erreur: ${err.message}`);
      }
      break;
    }

    case 'tiktok':
    case 'tt': {
      const url = args[1];
      if (!url) return reply(sock, msg, '❌ Usage: !tiktok <lien>');
      try {
        await reply(sock, msg, '⏳ Téléchargement TikTok en cours...');
        const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
        const data = res.data;
        if (!data?.video) return reply(sock, msg, '❌ Impossible de télécharger cette vidéo.');
        const text = `╔═══ 🎵 *TIKTOK* ═══╗
║ 👤 Auteur: ${data.author?.name || 'Inconnu'}
║ 📝 Caption: ${data.title?.slice(0, 60) || 'N/A'}
║ ❤️ Likes: ${data.stats?.likeCount?.toLocaleString() || '?'}
║ 💬 Commentaires: ${data.stats?.commentCount?.toLocaleString() || '?'}
╚════════════════════╝

📥 Lien sans filigrane: ${data.video?.noWatermark || data.video?.url}`;
        await reply(sock, msg, text);
      } catch (err) {
        await reply(sock, msg, `❌ Erreur: ${err.message}`);
      }
      break;
    }

    case 'instagram':
    case 'ig': {
      const url = args[1];
      if (!url) return reply(sock, msg, '❌ Usage: !ig <lien Instagram>');
      await reply(sock, msg, `📸 *INSTAGRAM*\n\n📥 Télécharge via: https://snapinsta.app/\n🔗 Lien: ${url}\n\n_Colle le lien sur le site pour télécharger._`);
      break;
    }

    case 'facebook':
    case 'fb': {
      const url = args[1];
      if (!url) return reply(sock, msg, '❌ Usage: !fb <lien Facebook>');
      await reply(sock, msg, `📘 *FACEBOOK*\n\n📥 Télécharge via: https://fdown.net/\n🔗 Lien: ${url}\n\n_Colle le lien sur le site pour télécharger._`);
      break;
    }

    case 'twitter':
    case 'x': {
      const url = args[1];
      if (!url) return reply(sock, msg, '❌ Usage: !twitter <lien Twitter/X>');
      await reply(sock, msg, `🐦 *TWITTER/X*\n\n📥 Télécharge via: https://twittervideodownloader.com/\n🔗 Lien: ${url}`);
      break;
    }

    case 'pinterest':
    case 'pin': {
      const url = args[1];
      if (!url) return reply(sock, msg, '❌ Usage: !pinterest <lien>');
      await reply(sock, msg, `📌 *PINTEREST*\n\n📥 Télécharge via: https://www.pinterestdownloader.com/\n🔗 Lien: ${url}`);
      break;
    }

    case 'spotify': {
      const query = args.slice(1).join(' ');
      if (!query) return reply(sock, msg, '❌ Usage: !spotify <titre>');
      try {
        const results = await ytSearch(query + ' spotify lyrics');
        const video = results.videos?.[0];
        if (!video) return reply(sock, msg, '❌ Aucun résultat.');
        const text = `╔═══ 🎧 *SPOTIFY* ═══╗
║ 🎵 Titre: ${video.title}
║ ⏱️ Durée: ${video.timestamp}
║ 👤 Artiste: ${video.author?.name}
╚════════════════════╝

📥 Écouter sur Spotify: https://open.spotify.com/search/${encodeURIComponent(query)}`;
        await reply(sock, msg, text);
      } catch {
        await reply(sock, msg, '❌ Erreur de recherche Spotify.');
      }
      break;
    }

    case 'play':
    case 'recherche': {
      const query = args.slice(1).join(' ');
      if (!query) return reply(sock, msg, '❌ Usage: !play <titre>');
      try {
        await reply(sock, msg, `🔍 Recherche: "${query}"...`);
        const results = await ytSearch(query);
        const videos = results.videos?.slice(0, 5);
        if (!videos?.length) return reply(sock, msg, '❌ Aucun résultat.');
        let text = `╔═══ 🎵 *RÉSULTATS* ═══╗\n`;
        videos.forEach((v, i) => {
          text += `║ ${i + 1}. ${v.title.slice(0, 40)} [${v.timestamp}]\n`;
        });
        text += `╚════════════════════╝\n\n💡 Utilise !ytmp3 ou !ytmp4 pour télécharger.`;
        await reply(sock, msg, text);
      } catch {
        await reply(sock, msg, '❌ Erreur de recherche.');
      }
      break;
    }

    case 'soundcloud':
    case 'sc': {
      const query = args.slice(1).join(' ');
      if (!query) return reply(sock, msg, '❌ Usage: !soundcloud <titre>');
      await reply(sock, msg, `🎵 *SOUNDCLOUD*\n\n🔍 Recherche: "${query}"\n📥 Accède à: https://soundcloud.com/search?q=${encodeURIComponent(query)}`);
      break;
    }

    case 'apk': {
      const app = args.slice(1).join(' ');
      if (!app) return reply(sock, msg, '❌ Usage: !apk <nom de l\'app>');
      await reply(sock, msg, `📱 *TÉLÉCHARGEMENT APK*\n\n🔍 App: ${app}\n📥 Accède à: https://apkpure.com/search?q=${encodeURIComponent(app)}\n\n⚠️ Installe uniquement des APKs de confiance.`);
      break;
    }

    case 'drive':
    case 'gdrive': {
      const url = args[1];
      if (!url) return reply(sock, msg, '❌ Usage: !drive <lien Google Drive>');
      await reply(sock, msg, `☁️ *GOOGLE DRIVE*\n\n📥 Télécharge via: https://sites.google.com/site/gdocs2direct/\n🔗 Lien: ${url}`);
      break;
    }

    case 'mediafire':
    case 'mf': {
      const url = args[1];
      if (!url) return reply(sock, msg, '❌ Usage: !mediafire <lien>');
      await reply(sock, msg, `📦 *MEDIAFIRE*\n\nClique sur le lien pour télécharger directement:\n🔗 ${url}`);
      break;
    }

    default:
      return null;
  }
}

module.exports = { downloadMenu };
