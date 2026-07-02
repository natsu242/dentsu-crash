const { reply, randomInt, randomChoice } = require('../lib/utils');

const triviaQuestions = [
  { q: 'Quelle est la capitale du Congo-Brazzaville ?', a: 'Brazzaville', options: ['Kinshasa', 'Brazzaville', 'Libreville', 'Bangui'] },
  { q: 'Combien de pays composent l\'Afrique ?', a: '54', options: ['47', '50', '54', '57'] },
  { q: 'Quel est le plus grand océan du monde ?', a: 'Pacifique', options: ['Atlantique', 'Indien', 'Pacifique', 'Arctique'] },
  { q: 'Quel pays a inventé le football ?', a: 'Angleterre', options: ['Brésil', 'France', 'Angleterre', 'Italie'] },
  { q: 'Quelle est la monnaie du Japon ?', a: 'Yen', options: ['Won', 'Yuan', 'Yen', 'Rupee'] },
  { q: 'Qui a peint la Joconde ?', a: 'Léonard de Vinci', options: ['Michel-Ange', 'Raphaël', 'Léonard de Vinci', 'Picasso'] },
  { q: 'En quelle année l\'homme a marché sur la Lune ?', a: '1969', options: ['1965', '1968', '1969', '1972'] },
  { q: 'Quel est l\'animal le plus rapide du monde ?', a: 'Guépard', options: ['Lion', 'Guépard', 'Aigle', 'Tigre'] },
];

const riddleQuestions = [
  { q: 'Je parle sans bouche, j\'entends sans oreilles. Qui suis-je ?', a: 'Echo' },
  { q: 'Plus je sèche, plus je suis mouillée. Qui suis-je ?', a: 'Serviette' },
  { q: 'J\'ai des aiguilles mais je ne couds pas. Qui suis-je ?', a: 'Montre ou sapin' },
  { q: 'Je cours mais n\'ai pas de jambes. Qui suis-je ?', a: 'Rivière' },
  { q: 'Je suis plein le matin, vide le soir. Qui suis-je ?', a: 'Assiette' },
];

const activeGames = new Map();

async function jeuxMenu(sock, msg, args, from, sender) {
  const cmd = args[0]?.toLowerCase();

  switch (cmd) {
    case 'tictactoe':
    case 'morpion': {
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!mentioned) return reply(sock, msg, '❌ Usage: !tictactoe @adversaire\n\nMentionne ton adversaire pour jouer !');
      if (mentioned === sender) return reply(sock, msg, '❌ Tu ne peux pas jouer contre toi-même !');
      const board = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      activeGames.set(from, { type: 'tictactoe', board, players: [sender, mentioned], turn: 0, moves: [] });
      const display = `${board[0]}|${board[1]}|${board[2]}\n-+-+-\n${board[3]}|${board[4]}|${board[5]}\n-+-+-\n${board[6]}|${board[7]}|${board[8]}`;
      await reply(sock, msg, `🎮 *TIC TAC TOE*\n\n@${sender.split('@')[0]} (❌) vs @${mentioned.split('@')[0]} (⭕)\n\n${display}\n\n🎯 C'est à @${sender.split('@')[0]} de jouer ! (Envoie le numéro de ta case)`);
      break;
    }

    case 'jouer':
    case 'play': {
      const game = activeGames.get(from);
      if (!game || game.type !== 'tictactoe') return reply(sock, msg, '❌ Aucun jeu en cours. Lance !tictactoe @adversaire');
      const pos = parseInt(args[1]) - 1;
      if (isNaN(pos) || pos < 0 || pos > 8) return reply(sock, msg, '❌ Position invalide (1-9)');
      if (game.board[pos] === '❌' || game.board[pos] === '⭕') return reply(sock, msg, '❌ Case déjà occupée !');
      if (game.players[game.turn] !== sender) return reply(sock, msg, '❌ Ce n\'est pas ton tour !');
      game.board[pos] = game.turn === 0 ? '❌' : '⭕';
      game.turn = 1 - game.turn;
      const display = `${game.board[0]}|${game.board[1]}|${game.board[2]}\n-+-+-\n${game.board[3]}|${game.board[4]}|${game.board[5]}\n-+-+-\n${game.board[6]}|${game.board[7]}|${game.board[8]}`;
      const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      const winner = wins.find(([a,b,c]) => game.board[a] === game.board[b] && game.board[b] === game.board[c]);
      if (winner) {
        const winnerJid = game.players[game.turn === 0 ? 1 : 0];
        activeGames.delete(from);
        return reply(sock, msg, `${display}\n\n🏆 *@${winnerJid.split('@')[0]} GAGNE !*\n\nFélicitations ! 🎉`);
      }
      if (!game.board.find(v => !['❌','⭕'].includes(v))) {
        activeGames.delete(from);
        return reply(sock, msg, `${display}\n\n🤝 *MATCH NUL !*`);
      }
      activeGames.set(from, game);
      await reply(sock, msg, `🎮 *TIC TAC TOE*\n\n${display}\n\n🎯 Au tour de @${game.players[game.turn].split('@')[0]}`);
      break;
    }

    case 'quiz':
    case 'trivia': {
      const q = randomChoice(triviaQuestions);
      const shuffled = q.options.sort(() => Math.random() - 0.5);
      const letters = ['A', 'B', 'C', 'D'];
      let text = `🧠 *QUIZ*\n\n❓ ${q.q}\n\n`;
      shuffled.forEach((opt, i) => { text += `${letters[i]}. ${opt}\n`; });
      text += `\n💡 Réponds avec la lettre ! (Réponse dans 30s)`;
      activeGames.set(from + '_quiz', { answer: q.a, shuffled, time: Date.now() });
      await reply(sock, msg, text);
      setTimeout(() => {
        const g = activeGames.get(from + '_quiz');
        if (g && Date.now() - g.time < 35000) {
          activeGames.delete(from + '_quiz');
          sock.sendMessage(from, { text: `⏰ Temps écoulé ! La réponse était: *${q.a}*` });
        }
      }, 30000);
      break;
    }

    case 'repondre':
    case 'rep': {
      const game = activeGames.get(from + '_quiz');
      if (!game) return reply(sock, msg, '❌ Aucun quiz en cours. Lance !quiz');
      const answer = args.slice(1).join(' ').toUpperCase();
      const letters = ['A', 'B', 'C', 'D'];
      const idx = letters.indexOf(answer);
      const chosen = idx >= 0 ? game.shuffled[idx] : args.slice(1).join(' ');
      activeGames.delete(from + '_quiz');
      if (chosen?.toLowerCase() === game.answer.toLowerCase()) {
        await reply(sock, msg, `✅ *BONNE RÉPONSE !* 🎉\n\n🏆 Félicitations @${sender.split('@')[0]} !`);
      } else {
        await reply(sock, msg, `❌ *MAUVAISE RÉPONSE !*\n\nLa bonne réponse était: *${game.answer}*`);
      }
      break;
    }

    case 'devinette':
    case 'riddle': {
      const r = randomChoice(riddleQuestions);
      activeGames.set(from + '_riddle', { answer: r.a.toLowerCase(), time: Date.now() });
      await reply(sock, msg, `🔮 *DEVINETTE*\n\n${r.q}\n\n💡 Utilise !repondre <ta réponse>`);
      break;
    }

    case 'casino': {
      const emojis = ['🍋', '🍊', '🍇', '🍓', '💎', '🔔', '⭐', '🎰'];
      const s1 = randomChoice(emojis), s2 = randomChoice(emojis), s3 = randomChoice(emojis);
      const won = s1 === s2 && s2 === s3;
      await reply(sock, msg, `🎰 *CASINO*\n\n| ${s1} | ${s2} | ${s3} |\n\n${won ? '🎉 JACKPOT ! Tu as gagné !' : '😢 Perdu ! Retente ta chance !'}`);
      break;
    }

    case 'slot':
    case 'machine': {
      const symbols = ['🍎', '🍊', '🍋', '🍇', '🍒', '💰', '⭐', '🎯'];
      const reels = [randomChoice(symbols), randomChoice(symbols), randomChoice(symbols)];
      const result = reels[0] === reels[1] && reels[1] === reels[2] ? '🎉 JACKPOT !' : reels[0] === reels[1] || reels[1] === reels[2] ? '💫 Petite victoire !' : '😢 Perdu !';
      await reply(sock, msg, `🎰 *MACHINE À SOUS*\n\n┌───────────────┐\n│ ${reels[0]} │ ${reels[1]} │ ${reels[2]} │\n└───────────────┘\n\n${result}`);
      break;
    }

    case 'rps':
    case 'pfc': {
      const choice = args[1]?.toLowerCase();
      const validChoices = { pierre: '🪨', papier: '📄', ciseaux: '✂️' };
      if (!choice || !validChoices[choice]) return reply(sock, msg, '❌ Choisis: !rps pierre | papier | ciseaux');
      const botChoices = Object.keys(validChoices);
      const botChoice = randomChoice(botChoices);
      const wins = { pierre: 'ciseaux', papier: 'pierre', ciseaux: 'papier' };
      const result = choice === botChoice ? '🤝 Match nul !' : wins[choice] === botChoice ? '🏆 Tu gagnes !' : '❌ Tu perds !';
      await reply(sock, msg, `✊ *PIERRE PAPIER CISEAUX*\n\nToi: ${validChoices[choice]} ${choice}\nBot: ${validChoices[botChoice]} ${botChoice}\n\n${result}`);
      break;
    }

    case 'nombre':
    case 'guess': {
      const secret = randomInt(1, 100);
      activeGames.set(from + '_number', { secret, attempts: 0, time: Date.now() });
      await reply(sock, msg, `🎯 *DEVINER UN NOMBRE*\n\nJ'ai choisi un nombre entre 1 et 100.\nTu as 7 tentatives ! Utilise !deviner <nombre>`);
      break;
    }

    case 'deviner': {
      const game = activeGames.get(from + '_number');
      if (!game) return reply(sock, msg, '❌ Lance d\'abord !nombre');
      const guess = parseInt(args[1]);
      if (isNaN(guess)) return reply(sock, msg, '❌ Donne un nombre valide.');
      game.attempts++;
      if (guess === game.secret) {
        activeGames.delete(from + '_number');
        return reply(sock, msg, `🎉 *BRAVO !* Tu as trouvé ${game.secret} en ${game.attempts} tentatives !`);
      }
      if (game.attempts >= 7) {
        activeGames.delete(from + '_number');
        return reply(sock, msg, `❌ *PERDU !* Le nombre était ${game.secret}.`);
      }
      const hint = guess < game.secret ? '⬆️ Plus grand !' : '⬇️ Plus petit !';
      activeGames.set(from + '_number', game);
      await reply(sock, msg, `${hint} (${7 - game.attempts} tentatives restantes)`);
      break;
    }

    case 'blackjack':
    case 'bj': {
      const deck = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const suits = ['♥', '♦', '♠', '♣'];
      const card = () => `${randomChoice(deck)}${randomChoice(suits)}`;
      const playerCards = [card(), card()];
      const dealerCards = [card(), '🂠'];
      await reply(sock, msg, `🃏 *BLACKJACK*\n\nTa main: ${playerCards.join(' ')}\nDealer: ${dealerCards.join(' ')}\n\nUtilise !hit (tirer) ou !stand (rester)`);
      break;
    }

    case 'stopjeu':
    case 'stopgame': {
      const keys = [from, from + '_quiz', from + '_riddle', from + '_number'];
      keys.forEach(k => activeGames.delete(k));
      await reply(sock, msg, '🛑 Tous les jeux en cours ont été arrêtés.');
      break;
    }

    default:
      return null;
  }
}

module.exports = { jeuxMenu };
