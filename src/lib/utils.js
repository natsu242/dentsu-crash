const config = require('../config');
const moment = require('moment-timezone');

// Récupérer le texte du message
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

// Vérifier si c'est l'owner
function isOwner(jid) {
  const ownerJid = config.ownerNumber + '@s.whatsapp.net';
  return jid === ownerJid;
}

// Vérifier si c'est admin du groupe
async function isAdmin(sock, groupJid, userJid) {
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const participant = metadata.participants.find((p) => p.id === userJid);
    return participant?.admin === 'admin' || participant?.admin === 'superadmin';
  } catch {
    return false;
  }
}

// Vérifier si le bot est admin
async function isBotAdmin(sock, groupJid) {
  try {
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    return isAdmin(sock, groupJid, botJid);
  } catch {
    return false;
  }
}

// Formater un JID pour l'affichage
function formatJid(jid) {
  return jid.split('@')[0];
}

// Obtenir l'heure actuelle
function getTime() {
  return moment().tz(config.timezone).format('HH:mm:ss');
}

// Obtenir la date actuelle
function getDate() {
  return moment().tz(config.timezone).format('DD/MM/YYYY');
}

// Obtenir le type du message
function getMsgType(msg) {
  const m = msg.message;
  if (!m) return '';
  const keys = Object.keys(m);
  if (keys.includes('imageMessage')) return 'image';
  if (keys.includes('videoMessage')) return 'video';
  if (keys.includes('stickerMessage')) return 'sticker';
  if (keys.includes('audioMessage')) return 'audio';
  if (keys.includes('documentMessage')) return 'document';
  if (keys.includes('extendedTextMessage')) return 'text';
  if (keys.includes('conversation')) return 'text';
  return keys[0] || 'unknown';
}

// Répondre avec mention
async function reply(sock, msg, text) {
  await sock.sendMessage(
    msg.key.remoteJid,
    { text: String(text) },
    { quoted: msg }
  );
}

// Envoyer un message simple
async function send(sock, jid, text) {
  await sock.sendMessage(jid, { text: String(text) });
}

// Répondre avec une image
async function sendImage(sock, jid, buffer, caption = '', quoted = null) {
  const opts = { image: buffer, caption };
  if (quoted) await sock.sendMessage(jid, opts, { quoted });
  else await sock.sendMessage(jid, opts);
}

// Délai
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Random entier
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Choisir aléatoirement dans un tableau
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Taille lisible
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

// Durée lisible (ms → string)
function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ${s % 60}s`;
}

module.exports = {
  getMessageText,
  isOwner,
  isAdmin,
  isBotAdmin,
  formatJid,
  getTime,
  getDate,
  getMsgType,
  reply,
  send,
  sendImage,
  sleep,
  randomInt,
  randomChoice,
  formatBytes,
  formatDuration,
};
