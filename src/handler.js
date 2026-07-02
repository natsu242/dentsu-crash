const config = require('./config');
const { getMessageText, isOwner, reply } = require('./lib/utils');
const { groupeMenu } = require('./commands/groupe');
const { ownerMenu }  = require('./commands/owner');
const { downloadMenu } = require('./commands/download');
const { funMenu }    = require('./commands/fun');
const { adultMenu }  = require('./commands/adult');
const { iaMenu }     = require('./commands/ia');
const { animeMenu }  = require('./commands/anime');
const { jeuxMenu }   = require('./commands/jeux');
const { mediaMenu }  = require('./commands/media');
const { bugMenu }    = require('./commands/bug');

// ─── Multi-prefix helper ───────────────────────────────────────────────────────
// Returns { matched: true, prefix, body } or { matched: false }
function parsePrefix(body) {
  const prefixes = config.prefixes || [config.prefix];
  for (const p of prefixes) {
    if (body.startsWith(p)) {
      return { matched: true, prefix: p, body: body.slice(p.length).trim() };
    }
  }
  return { matched: false };
}

// Default prefix shown in menus (first entry)
const DEF = config.prefixes?.[0] ?? config.prefix;

// ─── Menu texts (English) ─────────────────────────────────────────────────────

const MAIN_MENU = (p) => `
╔══════════════════════════════╗
║  🤖 *${config.botName} v${config.version}*
║       _by ${config.dev}_
╠══════════════════════════════╣
║  📌 Prefix: *${p}*  also: ! / / #
╠══════════════════════════════╣
║  *${p}group*   — Group Menu
║  *${p}owner*   — Owner Menu
║  *${p}dl*      — Download Menu
║  *${p}fun*     — Fun Menu
║  *${p}ai*      — AI Menu
║  *${p}anime*   — Anime Menu
║  *${p}games*   — Games Menu
║  *${p}media*   — Media Menu
║  *${p}bug*     — Bug Menu 🐛
║  *${p}adult*   — Adult 18+ 🔞
╠══════════════════════════════╣
║  *${p}ping*    — Latency check
║  *${p}info*    — Bot info
╚══════════════════════════════╝`.trim();

const GROUP_MENU_TEXT = (p) => `
╔══════════════════════════════╗
║       👥 *GROUP MENU*
╠══════════════════════════════╣
║ ${p}tagall — Mention everyone
║ ${p}hidetag <msg> — Hidden tag
║ ${p}kick @m — Kick member
║ ${p}add <num> — Add member
║ ${p}promote @m — Make admin
║ ${p}demote @m — Remove admin
║ ${p}mute — Close the group
║ ${p}unmute — Open the group
║ ${p}link — Group invite link
║ ${p}revoke — Reset link
║ ${p}setname <name> — Set group name
║ ${p}setdesc <desc> — Set description
║ ${p}info — Group info
║ ${p}antilink — Anti-link toggle
║ ${p}ban @m — Ban member
║ ${p}welcome <msg> — Welcome msg
║ ${p}poll Q|Op1|Op2 — Create poll
╚══════════════════════════════╝`.trim();

const OWNER_MENU_TEXT = (p) => `
╔══════════════════════════════╗
║       👑 *OWNER MENU*
╠══════════════════════════════╣
║ ${p}broadcast <msg> — Broadcast
║ ${p}block @m — Block user
║ ${p}unblock @m — Unblock user
║ ${p}listgc — List groups
║ ${p}joingc <link> — Join group
║ ${p}leavegc — Leave group
║ ${p}sessions — Active sessions
║ ${p}delsession <id> — Delete session
║ ${p}setprefix <sym> — Change prefix
║ ${p}setbio <text> — Change bio
║ ${p}setbotname <name> — Set bot name
║ ${p}speedtest — Speed test
║ ${p}sysinfo — System info
║ ${p}getid — Get chat ID
║ ${p}activegc — Active groups
║ ${p}eval <code> — Execute code
║ ${p}restart — Restart bot
║ ${p}shutdown — Shutdown bot
╚══════════════════════════════╝`.trim();

const DOWNLOAD_MENU_TEXT = (p) => `
╔══════════════════════════════╗
║      ⬇️  *DOWNLOAD MENU*
╠══════════════════════════════╣
║ ${p}yt <title/link> — YouTube
║ ${p}ytmp3 <title> — YouTube MP3
║ ${p}ytmp4 <title> — YouTube MP4
║ ${p}tiktok <link> — TikTok
║ ${p}ig <link> — Instagram
║ ${p}fb <link> — Facebook
║ ${p}twitter <link> — Twitter/X
║ ${p}pinterest <link> — Pinterest
║ ${p}spotify <title> — Spotify
║ ${p}play <title> — Search & play
║ ${p}soundcloud <title> — SoundCloud
║ ${p}apk <name> — Android APK
║ ${p}drive <link> — Google Drive
║ ${p}mediafire <link> — MediaFire
╚══════════════════════════════╝`.trim();

const FUN_MENU_TEXT = (p) => `
╔══════════════════════════════╗
║         😂 *FUN MENU*
╠══════════════════════════════╣
║ ${p}sticker — Create sticker
║ ${p}toimg — Sticker → image
║ ${p}joke — Random joke
║ ${p}quote — Random quote
║ ${p}8ball <question> — Magic 8-ball
║ ${p}flip — Coin flip
║ ${p}dice [faces] — Roll dice
║ ${p}rate <thing> — Rate anything
║ ${p}ship @m1 @m2 — Compatibility %
║ ${p}truth — Truth or Dare (truth)
║ ${p}dare — Truth or Dare (dare)
║ ${p}wyr — Would You Rather
║ ${p}compliment @m — Compliment
║ ${p}meme — Random meme
║ ${p}pp @m — Profile picture
║ ${p}bio @m — Contact bio
║ ${p}calc <expr> — Calculator
╚══════════════════════════════╝`.trim();

const AI_MENU_TEXT = (p) => `
╔══════════════════════════════╗
║         🤖 *AI MENU*
╠══════════════════════════════╣
║ ${p}gpt <question> — ChatGPT
║ ${p}gemini <question> — Gemini AI
║ ${p}imagine <desc> — Generate image
║ ${p}ailyrics <artist-title>
║ ${p}aitranslate <lang> <text>
║ ${p}aipoem [topic] — AI poem
║ ${p}aistory [topic] — AI story
║ ${p}aivision — Analyze image
║ ${p}aicode <desc> — Generate code
║ ${p}weather [city] — Weather
║ ${p}wiki <topic> — Wikipedia
╚══════════════════════════════╝`.trim();

const ANIME_MENU_TEXT = (p) => `
╔══════════════════════════════╗
║        🎌 *ANIME MENU*
╠══════════════════════════════╣
║ ${p}anime <title> — Anime info
║ ${p}manga <title> — Manga info
║ ${p}waifu — Waifu image
║ ${p}neko — Neko image
║ ${p}hug — Anime hug
║ ${p}kiss — Anime kiss
║ ${p}slap — Anime slap
║ ${p}animequote — Anime quote
║ ${p}animepic — Anime image
║ ${p}topanime — Top 10 anime
║ ${p}animenews — Anime news
║ ${p}animechar <name> — Character
╚══════════════════════════════╝`.trim();

const GAMES_MENU_TEXT = (p) => `
╔══════════════════════════════╗
║        🎮 *GAMES MENU*
╠══════════════════════════════╣
║ ${p}tictactoe @m — Tic-tac-toe
║ ${p}move <1-9> — Play move
║ ${p}quiz — General knowledge quiz
║ ${p}answer <A/B/C/D> — Answer quiz
║ ${p}riddle — Riddle
║ ${p}casino — Slot machine
║ ${p}slot — One-armed bandit
║ ${p}rps <rock/paper/scissors>
║ ${p}numgame — Guess the number
║ ${p}guess <nb> — Make a guess
║ ${p}blackjack — Card game
║ ${p}stopgame — Stop current game
╚══════════════════════════════╝`.trim();

const MEDIA_MENU_TEXT = (p) => `
╔══════════════════════════════╗
║        🎬 *MEDIA MENU*
╠══════════════════════════════╣
║ ${p}sticker — Create sticker
║ ${p}toimg — Sticker → image
║ ${p}lyrics <artist-title> — Lyrics
║ ${p}radio [station] — Radio
║ ${p}ytplay <title> — Play music
║ ${p}gif [category] — GIF
║ ${p}watermark — Add watermark
║ ${p}tomp3 — Video → MP3
║ ${p}tomp4 — Audio → MP4
║ ${p}filter <filter> — Photo filter
║ ${p}resize — Resize image
╚══════════════════════════════╝`.trim();

const BUG_MENU_TEXT = (p) => `
╔══════════════════════════════╗
║        🐛 *BUG MENU*
╠══════════════════════════════╣
║ ${p}bugreport <desc> — Submit bug
║ ${p}buglist — List all reports
║               (owner only)
║ ${p}bugfix <ID> — Mark as fixed
║               (owner only)
║ ${p}debug — Bot diagnostics
║               (owner only)
╚══════════════════════════════╝
_Report any bot issue to help improve_
_${config.botName} v${config.version}_`.trim();

const ADULT_MENU_TEXT = (p) => `
╔══════════════════════════════╗
║      🔞 *ADULT MENU (+18)*
╠══════════════════════════════╣
║ ⚠️ Adults only!
╠══════════════════════════════╣
║ ${p}hentai — Hentai image
║ ${p}nsfw_waifu — NSFW Waifu
║ ${p}nsfw_neko — NSFW Neko
║ ${p}trap — Trap NSFW
║ ${p}ero — Erotic content
║ ${p}nsfwgif — NSFW GIF
║ ${p}random_nsfw — Random 18+
║ ${p}cum — Adult content
╚══════════════════════════════╝
⚠️ 18+ only. Use at your own risk.`.trim();

// ─── Welcome / menu message sent on new connection ────────────────────────────
async function sendWelcomeMessage(sock, ownerJid) {
  const welcomeText = `╔══════════════════════════════╗
║  🤖 *${config.botName} v${config.version}*
║       _by ${config.dev}_
╠══════════════════════════════╣
║  ✅ Bot connected successfully!
╠══════════════════════════════╣
║  📌 Prefixes: . ! / #
║  Type *${DEF}menu* to see commands
╠══════════════════════════════╣
║  👑 Owner: ${config.ownerName}
║  📱 +${config.ownerNumber}
╚══════════════════════════════╝`;
  try {
    await sock.sendMessage(ownerJid, { text: welcomeText });
  } catch (e) {
    console.error('[WELCOME] Failed to send welcome message:', e.message);
  }
}

module.exports.sendWelcomeMessage = sendWelcomeMessage;

// ─── Main message handler ──────────────────────────────────────────────────────
async function handleMessage(sock, msg, store) {
  const from   = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const body   = getMessageText(msg);

  if (!body) return;
  if (msg.key.fromMe) return;

  // ─── Multi-prefix detection ──────────────────────────────────────────────
  const parsed = parsePrefix(body);
  if (!parsed.matched) return;

  const usedPrefix = parsed.prefix;
  const stripped   = parsed.body;
  const args       = stripped.split(/\s+/);
  const command    = args[0]?.toLowerCase();
  const isGroup    = from.endsWith('@g.us');

  console.log(`[CMD] ${sender.split('@')[0]} → ${usedPrefix}${command}`);

  try {
    switch (command) {

      // ── Main menus ────────────────────────────────────────────────────────
      case 'menu':
      case 'help':
      case 'start':
        await reply(sock, msg, MAIN_MENU(DEF));
        break;

      case 'group':
      case 'groupe':
      case 'gc':
        await reply(sock, msg, GROUP_MENU_TEXT(DEF));
        break;

      case 'owner':
      case 'ownerinfo':
        if (args.length === 1) {
          if (isOwner(sender)) {
            await reply(sock, msg, OWNER_MENU_TEXT(DEF));
          } else {
            await reply(sock, msg, `👑 *OWNER*\n\nOwner: ${config.ownerName}\nContact: wa.me/${config.ownerNumber}`);
          }
        } else {
          const r = await ownerMenu(sock, msg, args, from, sender);
          if (r === null) await reply(sock, msg, '❌ Unknown command in Owner Menu.');
        }
        break;

      case 'dl':
      case 'download':
        await reply(sock, msg, DOWNLOAD_MENU_TEXT(DEF));
        break;

      case 'fun':
        await reply(sock, msg, FUN_MENU_TEXT(DEF));
        break;

      case 'ai':
      case 'ia':
        await reply(sock, msg, AI_MENU_TEXT(DEF));
        break;

      case 'anime':
        await reply(sock, msg, ANIME_MENU_TEXT(DEF));
        break;

      case 'games':
      case 'jeux':
      case 'game':
        await reply(sock, msg, GAMES_MENU_TEXT(DEF));
        break;

      case 'media':
        await reply(sock, msg, MEDIA_MENU_TEXT(DEF));
        break;

      case 'bug':
        await reply(sock, msg, BUG_MENU_TEXT(DEF));
        break;

      case 'adult':
      case '18':
      case 'nsfw':
        await reply(sock, msg, ADULT_MENU_TEXT(DEF));
        break;

      // ── Utility commands ──────────────────────────────────────────────────

      case 'ping':
      case 'speed': {
        const start = Date.now();
        await reply(sock, msg, `⚡ Pong! Latency: ${Date.now() - start}ms`);
        break;
      }

      case 'botinfo':
      case 'info': {
        // In a group → show group info; in DM → show bot info
        if (isGroup && command === 'info') {
          await groupeMenu(sock, msg, [command, ...args.slice(1)], from, sender);
          break;
        }
        const { getSessionCount } = require('./lib/session-manager');
        const txt = `╔═══ 🤖 *BOT INFO* ════╗
║ 🏷️  Name: ${config.botName}
║ 📦 Version: v${config.version}
║ 💻 Dev: ${config.dev}
║ 👑 Owner: ${config.ownerName}
║ 📱 Contact: wa.me/${config.ownerNumber}
║ 📌 Prefixes: . ! / #
║ 📊 Sessions: ${getSessionCount()}/${config.maxSessions}
║ ⏱️  Uptime: ${Math.floor(process.uptime() / 60)}min
╚══════════════════════╝`;
        await reply(sock, msg, txt);
        break;
      }

      // ── Group commands ────────────────────────────────────────────────────
      case 'tagall': case 'hidetag': case 'kick': case 'add':
      case 'promote': case 'admin': case 'demote': case 'mute':
      case 'unmute': case 'link': case 'revoke': case 'setname': case 'setdesc':
      case 'infosgroupe': case 'antilink': case 'ban': case 'welcome': case 'poll': {
        await groupeMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ── Owner commands ────────────────────────────────────────────────────
      case 'broadcast': case 'block': case 'unblock': case 'listgc':
      case 'joingc': case 'leavegc': case 'sessions': case 'delsession':
      case 'setprefix': case 'setbio': case 'setbotname': case 'speedtest':
      case 'sysinfo': case 'getid': case 'activegc': case 'eval': case 'exec':
      case 'restart': case 'shutdown': {
        await ownerMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ── Download commands ─────────────────────────────────────────────────
      case 'yt': case 'youtube': case 'ytmp3': case 'ytmp4': case 'music':
      case 'tiktok': case 'tt': case 'instagram': case 'ig': case 'facebook':
      case 'fb': case 'twitter': case 'x': case 'pinterest': case 'pin':
      case 'spotify': case 'play': case 'soundcloud': case 'sc':
      case 'apk': case 'drive': case 'gdrive': case 'mediafire': case 'mf': {
        await downloadMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ── Fun commands ──────────────────────────────────────────────────────
      case 'sticker': case 'stick': case 'toimg': case 'joke': case 'blague':
      case 'quote': case 'citation': case '8ball': case 'flip': case 'pile':
      case 'dice': case 'des': case 'rate': case 'noter': case 'ship': case 'couple':
      case 'truth': case 'verite': case 'dare': case 'defi': case 'wyr':
      case 'compliment': case 'meme': case 'pp': case 'photo': case 'bio':
      case 'calc': case 'calcul': case 'math': {
        await funMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ── AI commands ───────────────────────────────────────────────────────
      case 'gpt': case 'chatgpt': case 'chat': case 'gemini': case 'imagine':
      case 'dalle': case 'genimage': case 'ailyrics': case 'aitranslate': case 'traduire':
      case 'aipoem': case 'aistory': case 'aihistoire': case 'aivision': case 'analyseimage':
      case 'aicode': case 'code': case 'weather': case 'meteo':
      case 'wiki': case 'wikipedia': {
        await iaMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ── Anime commands ────────────────────────────────────────────────────
      case 'waifu': case 'neko': case 'hug': case 'kiss': case 'slap':
      case 'animequote': case 'animepic': case 'animeimage': case 'topanime':
      case 'animenews': case 'animechar': case 'manga': {
        await animeMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ── Games commands ────────────────────────────────────────────────────
      case 'tictactoe': case 'morpion': case 'move': case 'jouer':
      case 'quiz': case 'trivia': case 'answer': case 'repondre': case 'rep':
      case 'riddle': case 'devinette': case 'casino': case 'slot': case 'machine':
      case 'rps': case 'pfc': case 'numgame': case 'nombre': case 'guess': case 'deviner':
      case 'blackjack': case 'bj': case 'stopgame': case 'stopjeu': {
        await jeuxMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ── Media commands ────────────────────────────────────────────────────
      case 'lyrics': case 'radio': case 'ytplay': case 'audioplay': case 'gif':
      case 'watermark': case 'tomp3': case 'tomp4':
      case 'filter': case 'filtre': case 'resize': case 'webp2img': {
        await mediaMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ── Bug commands ──────────────────────────────────────────────────────
      case 'bugreport': case 'report': case 'buglist': case 'bugs':
      case 'bugfix': case 'fixbug': case 'debug': case 'diagnostics': {
        await bugMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      // ── Adult commands ────────────────────────────────────────────────────
      case 'hentai': case 'nsfw_waifu': case 'nsfwwaifu': case 'nsfw_neko':
      case 'nsfwneko': case 'trap': case 'ero': case 'nsfwgif': case 'random_nsfw':
      case 'cum': case 'nsfwhelp': case 'adultmenu': {
        await adultMenu(sock, msg, [command, ...args.slice(1)], from, sender);
        break;
      }

      default:
        // Unknown command — silently ignore
        break;
    }
  } catch (err) {
    console.error(`[HANDLER ERROR] ${command}: ${err.message}`);
    try {
      await reply(sock, msg, `❌ Error running *${usedPrefix}${command}*\n${err.message}`);
    } catch (_) {}
  }
}

module.exports = { handleMessage };
