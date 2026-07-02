# 🤖 DENTSU CRASH v4.9.0

> Bot WhatsApp multi-sessions avec panel web — développé par **Natsu Tech**

![Version](https://img.shields.io/badge/version-4.9.0-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-blue)
![Sessions](https://img.shields.io/badge/sessions-60%2B-orange)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## 🚀 Fonctionnalités

- 🌐 **Panel web stylé** — connecte jusqu'à 60 sessions via QR code dans le navigateur
- 📱 **Multi-sessions** — supporte 60+ connexions WhatsApp simultanées
- ⚡ **Commandes switch/case** — architecture rapide et sans plugins
- 🎮 **9 catégories de menus** — groupe, owner, download, fun, IA, anime, jeux, media, adult

---

## 📋 Menus disponibles

| Menu | Préfixe | Description |
|------|---------|-------------|
| 👥 GROUPE | `!groupe` | Gestion des groupes WhatsApp |
| 👑 OWNER | `!owner` | Contrôle total du bot |
| ⬇️ DOWNLOAD | `!dl` | Téléchargement (YouTube, TikTok, IG...) |
| 😂 FUN | `!fun` | Divertissement et jeux sociaux |
| 🤖 IA | `!ia` | ChatGPT, Gemini, génération d'images |
| 🎌 ANIME | `!anime` | Anime, manga, waifu, neko |
| 🎮 JEUX | `!jeux` | Mini-jeux interactifs |
| 🎬 MEDIA | `!media` | Stickers, paroles, radio, filtres |
| 🔞 ADULT | `!adult` | Contenu +18 (désactivé par défaut) |

---

## ⚙️ Installation locale

```bash
git clone https://github.com/natsu242/dentsu-crash.git
cd dentsu-crash
npm install
cp .env.example .env
# Édite .env avec tes clés API
node index.js
```

Puis ouvre **http://localhost:3000** dans ton navigateur et scanne le QR code.

---

## 🚀 Déploiement sur Render

1. Fork ce repo sur ton GitHub
2. Va sur [render.com](https://render.com) → New Web Service
3. Connecte ton repo GitHub `dentsu-crash`
4. Render utilise automatiquement `render.yaml`
5. Ajoute tes variables d'environnement (optionnelles):
   - `OPENAI_API_KEY` — pour !gpt et !imagine
   - `GEMINI_API_KEY` — pour !gemini
6. Déploie et note l'URL (ex: `https://dentsu-crash.onrender.com`)

---

## 🌐 Déploiement sur Vercel (site web)

> Le site Vercel est l'interface de connexion — il redirige vers ton instance Render.

1. Crée un repo séparé avec juste le frontend (`src/web/public/`)
2. Dans `app.js`, change l'URL Socket.IO pour pointer vers ton Render:
   ```js
   const socket = io('https://dentsu-crash.onrender.com');
   ```
3. Déploie sur [vercel.com](https://vercel.com)

---

## 📌 Commandes principales

```
!menu       — Menu principal
!groupe     — Menu groupe (admins)
!owner      — Menu owner (propriétaire)
!dl         — Menu téléchargement
!fun        — Menu fun
!ia         — Menu IA
!anime      — Menu anime
!jeux       — Menu jeux
!media      — Menu média
!adult      — Menu adulte 18+
!ping       — Tester la latence
!info       — Info du bot
```

---

## 👑 Informations

- **Nom du bot**: DENTSU CRASH
- **Version**: 4.9.0
- **Développeur**: Natsu Tech
- **Owner**: Natsu Dev (+242 053 323 191)
- **GitHub**: [natsu242](https://github.com/natsu242)

---

## ⚠️ Avertissement

Ce bot est développé à des fins éducatives. Respecte les [Conditions d'utilisation de WhatsApp](https://www.whatsapp.com/legal/terms-of-service). L'auteur n'est pas responsable d'un usage abusif.

---

<div align="center">
  <strong>🤖 DENTSU CRASH v4.9.0 — by Natsu Tech</strong>
</div>
