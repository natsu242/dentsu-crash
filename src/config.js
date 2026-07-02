require('dotenv').config();

module.exports = {
  botName: 'DENTSU CRASH',
  version: '4.9.0',
  dev: 'Natsu Tech',
  ownerNumber: '242053323191',
  ownerName: 'Natsu Dev',

  // ─── Multi-prefix support ─────────────────────
  // First entry is the default/primary prefix shown in menus
  prefixes: ['.', '!', '/', '#'],
  prefix: '.', // kept for backward compat, equals prefixes[0]

  language: 'en',
  maxSessions: 60,
  sessionDir: './sessions',
  webPort: process.env.PORT || 3000,
  timezone: 'Africa/Brazzaville',

  // Social links
  github: 'https://github.com/natsu242',
  channel: 'https://whatsapp.com/channel/DENTSUCRASH',

  // API Keys (optional, add in .env)
  openaiKey: process.env.OPENAI_API_KEY || '',
  geminiKey: process.env.GEMINI_API_KEY || '',
  rapidApiKey: process.env.RAPIDAPI_KEY || '',

  banner: `
╔══════════════════════════════════════╗
║  ██████╗ ███████╗███╗   ██╗████████╗ ║
║  ██╔══██╗██╔════╝████╗  ██║╚══██╔══╝ ║
║  ██║  ██║█████╗  ██╔██╗ ██║   ██║    ║
║  ██║  ██║██╔══╝  ██║╚██╗██║   ██║    ║
║  ██████╔╝███████╗██║ ╚████║   ██║    ║
║  ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝    ║
║        ███████╗██╗   ██╗             ║
║        ██╔════╝██║   ██║             ║
║        ██║     ██║   ██║             ║
║        ██║     ██║   ██║             ║
║        ███████╗╚██████╔╝             ║
║        ╚══════╝ ╚═════╝              ║
║          CRASH  v4.9.0               ║
║       by Natsu Tech | 2025           ║
╚══════════════════════════════════════╝`,
};
