const config = require('../config');

// ─── Get message text (all message types) ─────────────────────────────────────
function getMessageText(msg) {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ''
  );
}

// ─── Owner check (accepts raw number or full JID) ────────────────────────────
function isOwner(jid) {
  const number = jid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
  return number === config.ownerNumber;
}

// ─── Group admin check ────────────────────────────────────────────────────────
async function isAdmin(sock, groupJid, userJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const p    = meta.participants.find((x) => x.id === userJid);
    return p?.admin === 'admin' || p?.admin === 'superadmin';
  } catch { return false; }
}

// ─── Bot admin check ──────────────────────────────────────────────────────────
async function isBotAdmin(sock, groupJid) {
  try {
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    return isAdmin(sock, groupJid, botJid);
  } catch { return false; }
}

// ─── Format a JID for display ─────────────────────────────────────────────────
function formatJid(jid) { return jid.split('@')[0]; }

// ─── Time / date helpers (no external deps) ───────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString('en-GB', { timeZone: config.timezone || 'UTC', hour12: false });
}

function getDate() {
  return new Date().toLocaleDateString('en-GB', { timeZone: config.timezone || 'UTC' });
}

// ─── Message type ─────────────────────────────────────────────────────────────
function getMsgType(msg) {
  const m = msg.message;
  if (!m) return '';
  const keys = Object.keys(m);
  if (keys.includes('imageMessage'))    return 'image';
  if (keys.includes('videoMessage'))    return 'video';
  if (keys.includes('stickerMessage'))  return 'sticker';
  if (keys.includes('audioMessage'))    return 'audio';
  if (keys.includes('documentMessage')) return 'document';
  if (keys.includes('extendedTextMessage')) return 'text';
  if (keys.includes('conversation'))    return 'text';
  return keys[0] || 'unknown';
}

// ─── Reply (quoted) ───────────────────────────────────────────────────────────
async function reply(sock, msg, text) {
  await sock.sendMessage(
    msg.key.remoteJid,
    { text: String(text) },
    { quoted: msg }
  );
}

// ─── Send plain message ───────────────────────────────────────────────────────
async function send(sock, jid, text) {
  await sock.sendMessage(jid, { text: String(text) });
}

// ─── Send image ───────────────────────────────────────────────────────────────
async function sendImage(sock, jid, buffer, caption = '', quoted = null) {
  const opts = { image: buffer, caption };
  if (quoted) await sock.sendMessage(jid, opts, { quoted });
  else        await sock.sendMessage(jid, opts);
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────
const sleep       = (ms) => new Promise((r) => setTimeout(r, ms));
const randomInt   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

function formatBytes(b) {
  if (b < 1024)       return b + ' B';
  if (b < 1048576)    return (b / 1024).toFixed(2) + ' KB';
  if (b < 1073741824) return (b / 1048576).toFixed(2) + ' MB';
  return (b / 1073741824).toFixed(2) + ' GB';
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ${s % 60}s`;
}

module.exports = {
  getMessageText, isOwner, isAdmin, isBotAdmin,
  formatJid, getTime, getDate, getMsgType,
  reply, send, sendImage,
  sleep, randomInt, randomChoice, formatBytes, formatDuration,
};
