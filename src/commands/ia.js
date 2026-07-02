const { reply } = require('../lib/utils');
const axios = require('axios');
const config = require('../config');

async function iaMenu(sock, msg, args, from, sender) {
  const cmd = args[0]?.toLowerCase();
  const text = args.slice(1).join(' ');

  switch (cmd) {
    case 'gpt':
    case 'chatgpt':
    case 'chat': {
      if (!text) return reply(sock, msg, '❌ Usage: !gpt <question>');
      try {
        await reply(sock, msg, '🤖 *ChatGPT*\n\n⏳ Réflexion en cours...');
        const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: `Tu es ${config.botName}, un assistant WhatsApp intelligent créé par ${config.dev}. Tu réponds en français de façon concise.` },
              { role: 'user', content: text },
            ],
            max_tokens: 500,
          },
          {
            headers: {
              Authorization: `Bearer ${config.openaiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const answer = res.data.choices[0].message.content;
        await reply(sock, msg, `🤖 *ChatGPT*\n\n${answer}\n\n_— ${config.botName} v${config.version}_`);
      } catch (err) {
        if (!config.openaiKey) {
          await reply(sock, msg, `🤖 *ChatGPT*\n\n⚠️ Clé API OpenAI non configurée.\n\nAjoute OPENAI_API_KEY dans le fichier .env\n\n_Pour activer cette fonctionnalité, l'owner doit ajouter sa clé API._`);
        } else {
          await reply(sock, msg, `❌ Erreur ChatGPT: ${err.response?.data?.error?.message || err.message}`);
        }
      }
      break;
    }

    case 'gemini': {
      if (!text) return reply(sock, msg, '❌ Usage: !gemini <question>');
      try {
        await reply(sock, msg, '✨ *Gemini AI*\n\n⏳ Génération en cours...');
        if (!config.geminiKey) throw new Error('NO_KEY');
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiKey}`,
          {
            contents: [{ parts: [{ text: `Tu es un assistant nommé ${config.botName}. Réponds en français: ${text}` }] }],
          }
        );
        const answer = res.data.candidates[0].content.parts[0].text;
        await reply(sock, msg, `✨ *Gemini AI*\n\n${answer}\n\n_— ${config.botName} v${config.version}_`);
      } catch {
        await reply(sock, msg, '✨ *Gemini AI*\n\n⚠️ Clé API Gemini non configurée.\nAjoute GEMINI_API_KEY dans le .env');
      }
      break;
    }

    case 'imagine':
    case 'dalle':
    case 'genimage': {
      if (!text) return reply(sock, msg, '❌ Usage: !imagine <description>');
      try {
        await reply(sock, msg, '🎨 *IA Image*\n\n⏳ Génération de l\'image...');
        if (!config.openaiKey) throw new Error('NO_KEY');
        const res = await axios.post(
          'https://api.openai.com/v1/images/generations',
          { prompt: text, n: 1, size: '512x512' },
          { headers: { Authorization: `Bearer ${config.openaiKey}` } }
        );
        const imageUrl = res.data.data[0].url;
        await sock.sendMessage(from, { image: { url: imageUrl }, caption: `🎨 *Image générée par IA*\n📝 Prompt: ${text}\n\n_— ${config.botName} v${config.version}_` }, { quoted: msg });
      } catch {
        await reply(sock, msg, '🎨 *IA Image*\n\n⚠️ Clé API OpenAI non configurée pour la génération d\'images.\nAjoute OPENAI_API_KEY dans le .env');
      }
      break;
    }

    case 'ailyrics':
    case 'paroles': {
      if (!text) return reply(sock, msg, '❌ Usage: !ailyrics <artiste - titre>');
      try {
        await reply(sock, msg, '🎵 *Paroles*\n\n⏳ Recherche des paroles...');
        const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(text.replace(' - ', '/'))}`)
          .catch(() => null);
        if (res?.data?.lyrics) {
          const lyrics = res.data.lyrics.slice(0, 1500);
          await reply(sock, msg, `🎵 *PAROLES: ${text.toUpperCase()}*\n\n${lyrics}${lyrics.length === 1500 ? '\n...(tronqué)' : ''}`);
        } else {
          await reply(sock, msg, `❌ Paroles introuvables pour "${text}". Format: !ailyrics Artiste - Titre`);
        }
      } catch {
        await reply(sock, msg, '❌ Erreur lors de la recherche des paroles.');
      }
      break;
    }

    case 'aitranslate':
    case 'traduire': {
      if (!text) return reply(sock, msg, '❌ Usage: !traduire fr "texte" (fr, en, es, pt, ar, zh...)');
      const parts = text.split('"');
      const lang = args[1] || 'en';
      const toTranslate = parts[1] || text.slice(3);
      try {
        const res = await axios.get(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(toTranslate)}&langpair=auto|${lang}`
        );
        const translated = res.data.responseData.translatedText;
        await reply(sock, msg, `🌍 *TRADUCTION → ${lang.toUpperCase()}*\n\n📝 Original: ${toTranslate}\n✅ Traduit: ${translated}`);
      } catch {
        await reply(sock, msg, '❌ Erreur de traduction. Essaie plus tard.');
      }
      break;
    }

    case 'aipoeme':
    case 'poeme': {
      const sujet = text || 'la vie';
      await reply(sock, msg, `📜 *POÈME IA*\n\nSur le thème: ${sujet}\n\nNous existons, fragment de lumière,\nDans l'espace infini du temps qui passe.\nChaque souffle, chaque prière,\nEst une trace que l'on laisse.\n\nLes étoiles nous guident la nuit,\nL'aurore efface nos peines.\nDans le silence on s'enfuit,\nVers des rives plus seraines.\n\n_Généré par ${config.botName} v${config.version}_`);
      break;
    }

    case 'aihistoire':
    case 'histoire': {
      const sujet = text || 'un héros mystérieux';
      await reply(sock, msg, `📖 *HISTOIRE IA*\n\nThème: ${sujet}\n\nIl était une fois, dans une contrée lointaine, un personnage nommé ${sujet}. Sa vie était ordinaire jusqu'au jour où tout bascula. Une nuit, sous un ciel étoilé, il/elle découvrit un secret qui allait changer le monde...\n\nLa quête avait commencé. Des alliés inattendus, des ennemis redoutables, et au bout du chemin, une vérité bouleversante. Le monde ne serait plus jamais le même.\n\n_À suivre... Généré par ${config.botName} v${config.version}_`);
      break;
    }

    case 'aivision':
    case 'analyseimage': {
      const image = msg.message?.imageMessage
        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      if (!image) return reply(sock, msg, '❌ Envoie ou cite une image avec !aivision');
      await reply(sock, msg, '👁️ *IA Vision*\n\n⚠️ Fonctionnalité disponible avec une clé OpenAI GPT-4V configurée dans le .env');
      break;
    }

    case 'aicode':
    case 'code': {
      if (!text) return reply(sock, msg, '❌ Usage: !aicode <description du code>');
      const exemples = {
        python: `\`\`\`python\n# Code généré par ${config.botName}\ndef solution():\n    # Implémentation de: ${text}\n    pass\n\nif __name__ == "__main__":\n    solution()\n\`\`\``,
        javascript: `\`\`\`javascript\n// Code généré par ${config.botName}\nfunction solution() {\n    // Implémentation de: ${text}\n}\n\nsolution();\n\`\`\``,
      };
      await reply(sock, msg, `💻 *AI CODE*\n\n📝 Tâche: ${text}\n\n${exemples.javascript}\n\n_Configurez OPENAI_API_KEY pour une génération complète._`);
      break;
    }

    case 'weather':
    case 'meteo': {
      const city = text || 'Brazzaville';
      try {
        const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
        await reply(sock, msg, `🌤️ *MÉTÉO*\n\n${res.data}`);
      } catch {
        await reply(sock, msg, `🌤️ *MÉTÉO: ${city}*\n\nImpossible de récupérer la météo. Essaie avec une grande ville.`);
      }
      break;
    }

    case 'wikipedia':
    case 'wiki': {
      if (!text) return reply(sock, msg, '❌ Usage: !wiki <sujet>');
      try {
        const res = await axios.get(
          `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`
        );
        const data = res.data;
        await reply(sock, msg, `📚 *WIKIPEDIA: ${data.title}*\n\n${data.extract?.slice(0, 800) || 'Aucun résumé disponible.'}\n\n🔗 ${data.content_urls?.desktop?.page || ''}`);
      } catch {
        await reply(sock, msg, `❌ Article "${text}" introuvable sur Wikipedia.`);
      }
      break;
    }

    default:
      return null;
  }
}

module.exports = { iaMenu };
