const config = require('./config');
const { getMessageText, isOwner, reply } = require('./lib/utils');
const { groupeMenu } = require('./commands/groupe');
const { ownerMenu } = require('./commands/owner');
const { downloadMenu } = require('./commands/download');
const { funMenu } = require('./commands/fun');
const { adultMenu } = require('./commands/adult');
const { iaMenu } = require('./commands/ia');
const { animeMenu } = require('./commands/anime');
const { jeuxMenu } = require('./commands/jeux');
const { mediaMenu } = require('./commands/media');

const MAIN_MENU = (prefix) => `
╔══════════════════════════════╗
║  🤖 *${config.botName} v${config.version}* 🤖
║      _by ${config.dev}_
╠══════════════════════════════╣
║  📌 Préfixe: *${prefix}*
╠══════════════════════════════╣
║  *${prefix}groupe* — Menu Groupe
║  *${prefix}owner* — Menu Owner
║  *${prefix}dl* — Menu Download
║  *${prefix}fun* — Menu Fun
║  *${prefix}ia* — Menu IA
║  *${prefix}anime* — Menu Anime
║  *${prefix}jeux* — Menu Jeux
║  *${prefix}media* — Menu Média
║  *${prefix}adult* — Menu 18+ 🔞
╠══════════════════════════════╣
║  *${prefix}ping* — Latence
║  *${prefix}info* — Info bot
╚══════════════════════════════╝
`.trim();

const GROUPE_MENU_TEXT = (prefix) => `
╔══════════════════════════════╗
║      👥 *GROUPE MENU*
╠══════════════════════════════╣
║ ${prefix}tagall — Mentionner tous
║ ${prefix}hidetag <msg> — Tag invisible
║ ${prefix}kick @m — Expulser
║ ${prefix}add <num> — Ajouter
║ ${prefix}promote @m — Prom. admin
║ ${prefix}demote @m — Rétrograder
║ ${prefix}mute — Fermer le groupe
║ ${prefix}unmute — Ouvrir le groupe
║ ${prefix}link — Lien du groupe
║ ${prefix}revoke — Réinitialiser lien
║ ${prefix}setname <nom> — Changer nom
║ ${prefix}setdesc <desc> — Changer desc
║ ${prefix}info — Info du groupe
║ ${prefix}antilink — Anti-lien
║ ${prefix}ban @m — Bannir
║ ${prefix}welcome <msg> — Bienvenue
║ ${prefix}poll Question|Op1|Op2 — Sondage
╚══════════════════════════════╝`.trim();

const OWNER_MENU_TEXT = (prefix) => `
╔══════════════════════════════╗
║      👑 *OWNER MENU*
╠══════════════════════════════╣
║ ${prefix}broadcast <msg> — Diffusion
║ ${prefix}block @m — Bloquer
║ ${prefix}unblock @m — Débloquer
║ ${prefix}listgc — Liste groupes
║ ${prefix}joingc <lien> — Rejoindre gc
║ ${prefix}leavegc — Quitter gc
║ ${prefix}sessions — Sessions actives
║ ${prefix}delsession <id> — Supprimer session
║ ${prefix}setprefix <sym> — Changer préfixe
║ ${prefix}setbio <texte> — Changer bio
║ ${prefix}setbotname <nom> — Changer nom bot
║ ${prefix}speedtest — Test vitesse
║ ${prefix}sysinfo — Info système
║ ${prefix}getid — Obtenir ID
║ ${prefix}activegc — Groupes actifs
║ ${prefix}eval <code> — Exécuter code
║ ${prefix}restart — Redémarrer
║ ${prefix}shutdown — Éteindre
╚══════════════════════════════╝`.trim();

const DOWNLOAD_MENU_TEXT = (prefix) => `
╔══════════════════════════════╗
║      ⬇️ *DOWNLOAD MENU*
╠══════════════════════════════╣
║ ${prefix}yt <titre/lien> — YouTube
║ ${prefix}ytmp3 <titre> — YouTube MP3
║ ${prefix}ytmp4 <titre> — YouTube MP4
║ ${prefix}tiktok <lien> — TikTok
║ ${prefix}ig <lien> — Instagram
║ ${prefix}fb <lien> — Facebook
║ ${prefix}twitter <lien> — Twitter/X
║ ${prefix}pinterest <lien> — Pinterest
║ ${prefix}spotify <titre> — Spotify
║ ${prefix}play <titre> — Recherche
║ ${prefix}soundcloud <titre> — SoundCloud
║ ${prefix}apk <nom> — APK Android
║ ${prefix}drive <lien> — Google Drive
║ ${prefix}mediafire <lien> — MediaFire
╚══════════════════════════════╝`.trim();

const FUN_MENU_TEXT = (prefix) => `
╔══════════════════════════════╗
║        😂 *FUN MENU*
╠══════════════════════════════╣
║ ${prefix}sticker — Créer sticker
║ ${prefix}toimg — Sticker → image
║ ${prefix}blague — Blague aléatoire
║ ${prefix}citation — Citation
║ ${prefix}8ball <question> — Boule 8
║ ${prefix}pile — Pile ou face
║ ${prefix}des [faces] — Lancer un dé
║ ${prefix}noter <chose> — Évaluer
║ ${prefix}ship @m1 @m2 — Compatibilité
║ ${prefix}verite — Vérité ou défi
║ ${prefix}defi — Défi
║ ${prefix}wyr — Tu préfères...
║ ${prefix}compliment @m — Compliment
║ ${prefix}meme — Meme aléatoire
║ ${prefix}pp @m — Photo de profil
║ ${prefix}bio @m — Bio d'un contact
║ ${prefix}calcul <expr> — Calculatrice
╚══════════════════════════════╝`.trim();

const IA_MENU_TEXT = (prefix) => `
╔══════════════════════════════╗
║        🤖 *IA MENU*
╠══════════════════════════════╣
║ ${prefix}gpt <question> — ChatGPT
║ ${prefix}gemini <question> — Gemini AI
║ ${prefix}imagine <desc> — Générer image
║ ${prefix}ailyrics <artiste-titre> — Paroles
║ ${prefix}aitranslate <lang> <texte>
║ ${prefix}aipoeme [sujet] — Poème IA
║ ${prefix}aihistoire [sujet] — Histoire IA
║ ${prefix}aivision — Analyser image
║ ${prefix}aicode <desc> — Générer code
║ ${prefix}weather [ville] — Météo
║ ${prefix}wiki <sujet> — Wikipedia
╚══════════════════════════════╝`.trim();

const ANIME_MENU_TEXT = (prefix) => `
╔══════════════════════════════╗
║       🎌 *ANIME MENU*
╠══════════════════════════════╣
║ ${prefix}anime <titre> — Info anime
║ ${prefix}manga <titre> — Info manga
║ ${prefix}waifu — Image waifu
║ ${prefix}neko — Image neko
║ ${prefix}hug — Câlin anime
║ ${prefix}kiss — Bisou anime
║ ${prefix}slap — Claque anime
║ ${prefix}animequote — Citation anime
║ ${prefix}animepic — Image anime
║ ${prefix}topanime — Top 10 anime
║ ${prefix}animenews — Actus anime
║ ${prefix}animechar <nom> — Personnage
╚══════════════════════════════╝`.trim();

const JEUX_MENU_TEXT = (prefix) => `
╔══════════════════════════════╗
║        🎮 *JEUX MENU*
╠══════════════════════════════╣
║ ${prefix}tictactoe @m — Morpion
║ ${prefix}jouer <1-9> — Jouer morpion
║ ${prefix}quiz — Quiz culture générale
║ ${prefix}repondre <A/B/C/D> — Répondre
║ ${prefix}devinette — Devinette
║ ${prefix}casino — Machine à sous
║ ${prefix}slot — Bandits manchots
║ ${prefix}rps <pierre/papier/ciseaux>
║ ${prefix}nombre — Deviner un nombre
║ ${prefix}deviner <nb> — Tenter
║ ${prefix}blackjack — Jeu de cartes
║ ${prefix}stopjeu — Arrêter les jeux
╚══════════════════════════════╝`.trim();

const MEDIA_MENU_TEXT = (prefix) => `
╔══════════════════════════════╗
║       🎬 *MEDIA MENU*
╠══════════════════════════════╣
║ ${prefix}sticker — Créer sticker
║ ${prefix}toimg — Sticker → image
║ ${prefix}lyrics <artiste-titre> — Paroles
║ ${prefix}radio [station] — Radio
║ ${prefix}ytplay <titre> — Jouer musique
║ ${prefix}gif [catégorie] — GIF
║ ${prefix}watermark — Filigrane image
║ ${prefix}tomp3 — Vidéo → MP3
║ ${prefix}tomp4 — Audio → MP4
║ ${prefix}filter <filtre> — Filtre photo
║ ${prefix}resize — Redimensionner
╚══════════════════════════════╝`.trim();

const ADULT_MENU_TEXT = (prefix) => `
╔══════════════════════════════╗
║     🔞 *ADULT MENU (+18)*
╠══════════════════════════════╣
║ ⚠️ Réservé aux majeurs !
╠══════════════════════════════╣
║ ${prefix}hentai — Image hentai
║ ${prefix}nsfw_waifu — Waifu NSFW
║ ${prefix}nsfw_neko — Neko NSFW
║ ${prefix}trap — Trap NSFW
║ ${prefix}ero — Contenu éro
║ ${prefix}nsfwgif — GIF NSFW
║ ${prefix}random_nsfw — Aléatoire
║ ${prefix}cum — Contenu adulte
╚══════════════════════════════╝
⚠️ +18 uniquement. Utilisation sous
   votre propre responsabilité.`.trim();

async function handleMessage(sock, msg, store) {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const body = getMessageText(msg);
  const prefix = config.prefix;

  if (!body.startsWith(prefix)) return;
  if (msg.key.fromMe) return;

  const args = body.slice(prefix.length).trim().split(/\s+/);
  const command = args[0]?.toLowerCase();
  const isGroup = from.endsWith('@g.us');

  console.log(`[CMD] ${sender.split('@')[0]} → ${body}`);

  try {
    switch (command) {
      // ─── MENUS PRINCIPAUX ───────────────────────
      case 'menu':
      case 'help':
      case 'aide':
        await reply(sock, msg, MAIN_MENU(prefix));
        break;

      case 'groupe':
      case 'gc':
        await reply(sock, msg, GROUPE_MENU_TEXT(prefix));
        break;

      case 'owner':
      case 'ownerinfo':
        if (args.length === 1) {
          if (isOwner(sender.replace('@s.whatsapp.net', ''))) {
            await reply(sock, msg, OWNER_MENU_TEXT(prefix));
          } else {
            await reply(sock, msg, `👑 *OWNER*\n\nPropriétaire: ${config.ownerName}\nContact: wa.me/${config.ownerNumber}`);
          }
        } else {
          const r = await ownerMenu(sock, msg, args, from, sender);
          if (r === null) await reply(sock, msg, '❌ Commande inconnue dans Owner Menu.');
        }
        break;

      case 'dl':
      case 'download':
      case 'telecharger':
        await reply(sock, msg, DOWNLOAD_MENU_TEXT(prefix));
        break;

      case 'fun':
        await reply(sock, msg, FUN_MENU_TEXT(prefix));
        break;

      case 'ia':
      case 'ai':
        await reply(sock, msg, IA_MENU_TEXT(prefix));
        break;

      case 'anime':
        await reply(sock, msg, ANIME_MENU_TEXT(prefix));
        break;

      case 'jeux':
      case 'game':
      case 'games':
        await reply(sock, msg, JEUX_MENU_TEXT(prefix));
        break;

      case 'media':
        await reply(sock, msg, MEDIA_MENU_TEXT(prefix));
        break;

      case 'adult':
      case '18':
      case 'nsfw':
        await reply(sock, msg, ADULT_MENU_TEXT(prefix));
        break;

      // ─── COMMANDES DIRECTES (sans sous-menu) ────

      case 'ping':
      case 'speed': {
        const start = Date.now();
        await reply(sock, msg, `⚡ Pong! Latence: ${Date.now() - start}ms`);
        break;
      }

      case 'botinfo': {
        const { getSessionCount } = require('./lib/session-manager');
        const text = `╔═══ 🤖 *BOT INFO* ═══╗
║ 🏷️ Nom: ${config.botName}
║ 📦 Version: v${config.version}
║ 💻 Dev: ${config.dev}
║ 👑 Owner: ${config.ownerName}
║ 📱 Contact: wa.me/${config.ownerNumber}
║ 📌 Préfixe: ${prefix}
║ 📊 Sessions: ${getSessionCount()}/${config.maxSessions}
║ ⏱️ Uptime: ${Math.floor(process.uptime() / 60)}min
╚═══════════════════════╝`;
        await reply(sock, msg, text);
        break;
      }

      // !info : info groupe si en groupe, sinon info bot
      case 'info': {
        if (isGroup) {
          await groupeMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        } else {
          const { getSessionCount } = require('./lib/session-manager');
          const txt = `╔═══ 🤖 *BOT INFO* ═══╗
║ 🏷️ Nom: ${config.botName}
║ 📦 Version: v${config.version}
║ 💻 Dev: ${config.dev}
║ 👑 Owner: ${config.ownerName}
║ 📱 Contact: wa.me/${config.ownerNumber}
║ 📌 Préfixe: ${prefix}
║ 📊 Sessions: ${getSessionCount()}/${config.maxSessions}
║ ⏱️ Uptime: ${Math.floor(process.uptime() / 60)}min
╚═══════════════════════╝`;
          await reply(sock, msg, txt);
        }
        break;
      }

      // ─── DÉLÉGATION AUX SOUS-MENUS ──────────────

      // GROUPE
      case 'tagall': case 'hidetag': case 'kick': case 'expulser':
      case 'add': case 'ajouter': case 'promote': case 'admin':
      case 'demote': case 'mute': case 'fermer': case 'unmute': case 'ouvrir':
      case 'link': case 'lien': case 'revoke': case 'setname': case 'setdesc':
      case 'infosgroupe': case 'antilink': case 'ban': case 'bannir':
      case 'welcome': case 'poll': case 'sondage': {
        await groupeMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // OWNER
      case 'broadcast': case 'diffuser': case 'block': case 'bloquer':
      case 'unblock': case 'debloquer': case 'listgc': case 'listegroupes':
      case 'joingc': case 'leavegc': case 'quittergc': case 'sessions':
      case 'delsession': case 'setprefix': case 'setbio': case 'setbotname':
      case 'speedtest': case 'sysinfo': case 'systeme': case 'getid':
      case 'activegc': case 'eval': case 'exec': case 'restart':
      case 'redemarrer': case 'shutdown': case 'eteindre': {
        await ownerMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // DOWNLOAD
      case 'yt': case 'youtube': case 'ytmp3': case 'ytmp4': case 'music':
      case 'tiktok': case 'tt': case 'instagram': case 'ig': case 'facebook':
      case 'fb': case 'twitter': case 'x': case 'pinterest': case 'pin':
      case 'spotify': case 'play': case 'recherche': case 'soundcloud': case 'sc':
      case 'apk': case 'drive': case 'gdrive': case 'mediafire': case 'mf': {
        await downloadMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // FUN
      case 'stick': case 'sticker': case 'toimg': case 'blague': case 'joke':
      case 'citation': case 'quote': case '8ball': case 'pile': case 'flip':
      case 'des': case 'dice': case 'noter': case 'rate': case 'ship': case 'couple':
      case 'verite': case 'truth': case 'defi': case 'dare': case 'wyr': case 'ou':
      case 'compliment': case 'meme': case 'pp': case 'photo': case 'bio':
      case 'statut': case 'calcul': case 'math': {
        await funMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // IA
      case 'gpt': case 'chatgpt': case 'chat': case 'gemini': case 'imagine':
      case 'dalle': case 'genimage': case 'ailyrics': case 'paroles':
      case 'aitranslate': case 'traduire': case 'aipoeme': case 'poeme':
      case 'aihistoire': case 'histoire': case 'aivision': case 'analyseimage':
      case 'aicode': case 'code': case 'weather': case 'meteo':
      case 'wikipedia': case 'wiki': {
        await iaMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ANIME
      case 'waifu': case 'neko': case 'hug': case 'calin': case 'kiss': case 'bisou':
      case 'slap': case 'gifle': case 'animequote': case 'animepic': case 'animeimage':
      case 'topanime': case 'animenews': case 'animechar': case 'personnage':
      case 'manga': {
        await animeMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // JEUX
      case 'tictactoe': case 'morpion': case 'jouer': case 'quiz': case 'trivia':
      case 'repondre': case 'rep': case 'devinette': case 'riddle': case 'casino':
      case 'slot': case 'machine': case 'rps': case 'pfc': case 'nombre': case 'guess':
      case 'deviner': case 'blackjack': case 'bj': case 'stopjeu': case 'stopgame': {
        await jeuxMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // MEDIA
      case 'lyrics': case 'radio': case 'ytplay': case 'audioplay': case 'gif':
      case 'watermark': case 'filigrane': case 'tomp3': case 'tomp4':
      case 'filter': case 'filtre': case 'resize': case 'redimension': case 'webp2img': {
        await mediaMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ADULT
      case 'hentai': case 'nsfw_waifu': case 'nsfwwaifu': case 'nsfw_neko':
      case 'nsfwneko': case 'trap': case 'ero': case 'nsfwgif': case 'random_nsfw':
      case 'punch_nsfw': case 'cum': case 'nsfwhelp': case 'adultmenu': case 'bj_nsfw': {
        await adultMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      default:
        // Commande inconnue — on ignore silencieusement
        break;
    }
  } catch (err) {
    console.error(`[HANDLER ERROR] ${command}: ${err.message}`);
    try {
      await reply(sock, msg, `❌ Erreur lors de l'exécution de !${command}.\n${err.message}`);
    } catch (_) {}
  }
}

module.exports = { handleMessage };
