const { reply } = require('../lib/utils');
const ytSearch = require('yt-search');

async function mediaMenu(sock, msg, args, from, sender) {
  const cmd = args[0]?.toLowerCase();
  const query = args.slice(1).join(' ');

  switch (cmd) {
    case 'lyrics':
    case 'paroles': {
      if (!query) return reply(sock, msg, '❌ Usage: !lyrics Artiste - Titre');
      try {
        const axios = require('axios');
        const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(query.replace(' - ', '/'))}`).catch(() => null);
        if (res?.data?.lyrics) {
          const l = res.data.lyrics.slice(0, 3000);
          await reply(sock, msg, `🎵 *PAROLES: ${query.toUpperCase()}*\n\n${l}${l.length === 3000 ? '\n...(tronqué)' : ''}`);
        } else {
          await reply(sock, msg, `❌ Paroles introuvables pour "${query}".\nFormat: !lyrics Artiste - Titre`);
        }
      } catch {
        await reply(sock, msg, '❌ Erreur lors de la recherche des paroles.');
      }
      break;
    }

    case 'radio': {
      const radios = {
        france: '🇫🇷 France Info: https://stream.radiofrance.fr/franceinfo/franceinfo.mp3',
        congo: '🇨🇬 Radio Congo: http://stream.zeno.fm/f3wvbbqmdg8uv',
        africa: '🌍 Afrique Radio: https://stream.rcs.revma.com/an1ugyygkk8uv',
        nrj: '🎵 NRJ: https://scdn.nrjaudio.fm/adwz1/fr/30001/mp3_128.mp3',
        fun: '🎶 Fun Radio: https://streaming.radio.funradio.fr/fun-1-44-128',
      };
      const station = args[1]?.toLowerCase();
      if (!station || !radios[station]) {
        const list = Object.entries(radios).map(([k, v]) => `• ${k}: ${v.split(':')[1].slice(0, 30)}...`).join('\n');
        return reply(sock, msg, `📻 *RADIOS DISPONIBLES*\n\n${list}\n\nUsage: !radio <nom>`);
      }
      await reply(sock, msg, `📻 *RADIO*\n\n${radios[station]}`);
      break;
    }

    case 'sticker':
    case 'stick': {
      const image = msg.message?.imageMessage
        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      if (!image) return reply(sock, msg, '❌ Envoie une image avec la commande !sticker en caption, ou cite une image avec !sticker');
      try {
        await reply(sock, msg, '⏳ Création du sticker en cours...');
        const stream = await sock.downloadContentFromMessage(image, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        await sock.sendMessage(from, {
          sticker: buffer,
          mimetype: 'image/webp',
        }, { quoted: msg });
      } catch (err) {
        await reply(sock, msg, `❌ Erreur sticker: ${err.message}`);
      }
      break;
    }

    case 'toimg':
    case 'webp2img': {
      const sticker = msg.message?.stickerMessage
        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
      if (!sticker) return reply(sock, msg, '❌ Cite un sticker avec !toimg');
      try {
        await reply(sock, msg, '⏳ Conversion sticker → image...');
        const stream = await sock.downloadContentFromMessage(sticker, 'sticker');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        await sock.sendMessage(from, {
          image: buffer,
          caption: '✅ Sticker converti en image !',
          mimetype: 'image/png',
        }, { quoted: msg });
      } catch (err) {
        await reply(sock, msg, `❌ Erreur: ${err.message}`);
      }
      break;
    }

    case 'ytplay':
    case 'audioplay': {
      if (!query) return reply(sock, msg, '❌ Usage: !ytplay <titre>');
      try {
        await reply(sock, msg, `🎵 Recherche: "${query}"...`);
        const results = await ytSearch(query);
        const video = results.videos?.[0];
        if (!video) return reply(sock, msg, '❌ Aucun résultat.');
        await reply(sock, msg, `╔═══ 🎵 *NOW PLAYING* ═══╗\n║ 🎤 ${video.title}\n║ ⏱️ ${video.timestamp}\n║ 👤 ${video.author?.name}\n╚════════════════════╝\n\n📥 Télécharger: https://cnvmp3.com/v12/?url=${encodeURIComponent(video.url)}`);
      } catch {
        await reply(sock, msg, '❌ Erreur lors de la lecture.');
      }
      break;
    }

    case 'resize':
    case 'redimension': {
      const image = msg.message?.imageMessage
        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      if (!image) return reply(sock, msg, '❌ Cite une image avec !resize');
      const size = args[1] || '512x512';
      await reply(sock, msg, `📐 *REDIMENSIONNEMENT*\n\nTaille cible: ${size}\n⚠️ Fonctionnalité disponible avec sharp configuré.`);
      break;
    }

    case 'gif': {
      const categories = ['cat', 'dog', 'anime', 'funny', 'dance', 'happy', 'sad', 'wow', 'fire', 'love'];
      const cat = args[1] || 'funny';
      try {
        const axios = require('axios');
        const res = await axios.get(`https://api.tenor.com/v2/search?q=${cat}&limit=1&key=LIVDSRZULELA`);
        const gif = res.data.results?.[0]?.media_formats?.gif?.url;
        if (gif) {
          await reply(sock, msg, `🎬 *GIF ${cat.toUpperCase()}*\n\n${gif}`);
        } else {
          await reply(sock, msg, `🎬 Recherche GIF pour: ${cat}\n\nVisite: https://tenor.com/search/${cat}`);
        }
      } catch {
        await reply(sock, msg, `🎬 *GIF ${cat.toUpperCase()}*\n\nRecherche sur: https://tenor.com/search/${cat}`);
      }
      break;
    }

    case 'watermark':
    case 'filigrane': {
      const image = msg.message?.imageMessage
        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      if (!image) return reply(sock, msg, '❌ Cite une image avec !watermark <texte>');
      const waterText = query || config?.botName || 'DENTSU CRASH';
      await reply(sock, msg, `🖼️ *FILIGRANE*\n\nTexte: "${waterText}"\n⚠️ Fonctionnalité disponible avec jimp/sharp configuré.`);
      break;
    }

    case 'tomp3': {
      const video = msg.message?.videoMessage
        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
      if (!video) return reply(sock, msg, '❌ Cite une vidéo avec !tomp3');
      await reply(sock, msg, '🎵 *CONVERSION EN MP3*\n\n⚠️ Fonctionnalité disponible avec ffmpeg configuré.');
      break;
    }

    case 'tomp4': {
      const audio = msg.message?.audioMessage
        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage;
      if (!audio) return reply(sock, msg, '❌ Cite un audio avec !tomp4');
      await reply(sock, msg, '🎬 *CONVERSION EN MP4*\n\n⚠️ Fonctionnalité disponible avec ffmpeg configuré.');
      break;
    }

    case 'filter':
    case 'filtre': {
      const image = msg.message?.imageMessage
        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      if (!image) return reply(sock, msg, '❌ Cite une image avec !filter <filtre>\nFiltres: gray, sepia, blur, vintage, neon');
      const filterName = args[1] || 'gray';
      await reply(sock, msg, `🎨 *FILTRE ${filterName.toUpperCase()}*\n\n⚠️ Fonctionnalité disponible avec jimp configuré.`);
      break;
    }

    default:
      return null;
  }
}

module.exports = { mediaMenu };
