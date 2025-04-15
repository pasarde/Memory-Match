// Konfigurasi game
const DIFFICULTY_CONFIG = {
  easy: { pairs: 6, time: 60, lives: 7, speedMultiplier: 1 },
  medium: { pairs: 8, time: 45, lives: 5, speedMultiplier: 1.2 },
  hard: { pairs: 10, time: 30, lives: 4, speedMultiplier: 1.5 },
  expert: { pairs: 12, time: 25, lives: 3, speedMultiplier: 2 }
};

const THEMES = {
  classic: {
    icons: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'],
    colors: ['#0118D8', '#1B56FD']
  },
  fruits: {
    icons: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🥝', '🍍'],
    colors: ['#22C55E', '#16A34A']
  },
  space: {
    icons: ['🚀', '🛸', '🌍', '🌙', '⭐', '☄️', '🌠', '🌌', '🪐', '👾', '🌞', '🌛'],
    colors: ['#3730A3', '#6366F1']
  }
};

const ACHIEVEMENTS = {
  speedster: {
    title: "Speedster",
    description: "Selesaikan level di bawah 15 detik",
    icon: "⚡"
  },
  perfect: {
    title: "Perfect",
    description: "Selesaikan tanpa kesalahan",
    icon: "🌟"
  },
  comboMaster: {
    title: "Combo Master",
    description: "Dapatkan 5x combo",
    icon: "🔥"
  },
  multiplayerChamp: {
    title: "Multiplayer Champ",
    description: "Menang di mode multiplayer",
    icon: "🏆"
  }
};

const POWERUPS = {
  timeFreeze: {
    icon: "❄️",
    duration: 5,
    effect: () => {
      clearInterval(timerInterval);
      setTimeout(startTimer, 5000);
      showFloatingText(document.getElementById('time-freeze'), "Waktu Dibekukan!");
    }
  },
  revealAll: {
    icon: "👁️",
    duration: 2,
    effect: () => {
      cards.forEach(card => {
        if (!card.isMatched) showCardBriefly(card.id);
      });
      showFloatingText(document.getElementById('reveal-all'), "Semua Terlihat!");
    }
  }
};

const COMBO_MULTIPLIER = 1.5;

// State game
let cards = [];
let flippedCards = [];
let matchedPairs = [];
let lives = 3;
let score = 0;
let timeLeft = 0;
let timerInterval;
let difficulty = 'easy';
let hintsRemaining = 2;
let lastFlipTime = 0;
let soundEnabled = true;
let comboCount = 0;
let currentTheme = 'classic';
let playerName = '';
let powerUpsUsed = { timeFreeze: false, revealAll: false };
let darkMode = localStorage.getItem('darkMode') === 'true';
let isPaused = false;
let isMultiplayer = false;
let players = [
  { name: 'Player 1', score: 0 },
  { name: 'Player 2', score: 0 }
];
let currentPlayer = 0;
let highScores = JSON.parse(localStorage.getItem('memoryMatchHighScores')) || {
  easy: 0,
  medium: 0,
  hard: 0,
  expert: 0
};

// Preload sounds
const sounds = {
  flip: null,
  match: null,
  wrong: null,
  win: null,
  lose: null,
  hint: null,
  powerup: null
};

function preloadSounds() {
  sounds.flip = createAudio('/assets/oh-[AudioTrimmer.com].opus');
  sounds.match = createAudio('/assets/benar-[AudioTrimmer.com].opus');
  sounds.wrong = createAudio('/assets/salah-[AudioTrimmer.com].opus');
  sounds.win = createAudio('/assets/win-[AudioTrimmer.com].opus');
  sounds.lose = createAudio('/assets/lose-[AudioTrimmer.com].opus');
  sounds.hint = createAudio('/assets/hint-[AudioTrimmer.com].opus');
  sounds.powerup = createAudio('/assets/hint-[AudioTrimmer.com].opus');
}

function createAudio(src) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.5;
    audio.load();
    audio.onerror = () => {
      console.warn(`Failed to load audio: ${src}`);
      return null;
    };
    return audio;
  } catch (error) {
    console.warn(`Error creating audio for ${src}:`, error);
    return null;
  }
}

function playSound(type) {
  if (!soundEnabled || !sounds[type]) return;
  const sound = sounds[type];
  try {
    sound.currentTime = 0;
    sound.play().catch(error => {
      console.warn(`Failed to play sound "${type}":`, error);
    });
  } catch (error) {
    console.warn(`Error playing sound "${type}":`, error);
  }
}

function vibrate(duration = 50) {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
}

function showFloatingText(element, text) {
  const rect = element.getBoundingClientRect();
  const floatingText = document.createElement('div');
  floatingText.className = 'floating-text score-popup';
  floatingText.textContent = text;
  floatingText.style.position = 'absolute';
  floatingText.style.top = `${rect.top - 20}px`;
  floatingText.style.left = `${rect.left + rect.width / 2 - 40}px`;
  document.body.appendChild(floatingText);
  setTimeout(() => floatingText.remove(), 1200);
}

function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode);
  document.body.className = `theme-${currentTheme} ${darkMode ? 'dark-mode' : ''}`;
  const darkModeIcon = document.getElementById('dark-mode-icon');
  darkModeIcon.innerHTML = darkMode
    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />'
    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const soundIcon = document.getElementById('sound-icon');
  soundIcon.innerHTML = soundEnabled
    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M12 9.999a2 2 0 010 4M19.07 4.93a9 9 0 010 14.14M5 10.5A.5.5 0 015.5 10H9a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H5.5a.5.5 0 01-.5-.5v-3z"></path>'
    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707a1 1 0 011.414 0l2 2M3 3l18 18M11 11l4 4m-4-4l4 4" />';
}

// Fungsi game
function createCards(difficultyLevel) {
  try {
    const numPairs = DIFFICULTY_CONFIG[difficultyLevel].pairs;
    if (!THEMES[currentTheme]) {
      console.error(`Theme "${currentTheme}" not found! Falling back to 'classic'.`);
      currentTheme = 'classic';
    }
    const selectedEmojis = THEMES[currentTheme].icons.slice(0, numPairs);
    const pairs = [...selectedEmojis, ...selectedEmojis];
    cards = pairs.sort(() => Math.random() - 0.5).map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
      matchedBy: null
    }));
    renderCards();
  } catch (error) {
    console.error('Error creating cards:', error);
    alert('Gagal membuat kartu. Cek console untuk detail.');
  }
}

function renderCards() {
  const gameBoard = document.getElementById('game-board');
  if (!gameBoard) {
    console.error('Game board not found!');
    return;
  }

  // Clear existing cards
  gameBoard.innerHTML = '';

  document.body.className = `theme-${currentTheme} ${darkMode ? 'dark-mode' : ''}`;

  let gridClass;
  switch (difficulty) {
    case 'easy': gridClass = 'grid-cols-3 sm:grid-cols-4'; break;
    case 'medium': gridClass = 'grid-cols-4 sm:grid-cols-4'; break;
    case 'hard': gridClass = 'grid-cols-4 sm:grid-cols-5'; break;
    case 'expert': gridClass = 'grid-cols-4 sm:grid-cols-6'; break;
    default: gridClass = 'grid-cols-4';
  }

  gameBoard.className = `grid ${gridClass} gap-3 sm:gap-4 justify-center`;

  let delay = 0;
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card relative fade-in-up';
    cardElement.dataset.id = card.id;

    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';
    cardElement.appendChild(cardInner);

    const back = document.createElement('div');
    back.className = 'card-back';
    back.innerHTML = `<span class="card-question">?</span>`;
    cardInner.appendChild(back);

    const front = document.createElement('div');
    front.className = 'card-front';
    front.textContent = card.emoji;
    cardInner.appendChild(front);

    cardElement.style.animation = `fade-in-up 0.4s ease forwards ${delay}s`;
    delay += 0.05;

    if (card.isMatched) {
      cardElement.classList.add('matched');
      if (card.matchedBy !== null) {
        cardElement.classList.add(`player${card.matchedBy + 1}`);
      }
    }
    if (card.isFlipped) {
      cardElement.classList.add('flipped', 'card-flip');
    }

    cardElement.setAttribute('tabindex', '0');
    cardElement.setAttribute('aria-label', `Kartu ${card.isFlipped ? card.emoji : 'tertutup'}`);
    cardElement.addEventListener('click', () => flipCard(card.id));
    cardElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        flipCard(card.id);
        e.preventDefault();
      }
    });

    gameBoard.appendChild(cardElement);
  });

  const playerContainer = document.getElementById('current-player-container');
  if (isMultiplayer) {
    playerContainer.classList.remove('hidden');
    playerContainer.classList.remove('player1', 'player2');
    playerContainer.classList.add(`player${currentPlayer + 1}`);
    document.getElementById('current-player').textContent = players[currentPlayer].name;
  } else {
    playerContainer.classList.add('hidden');
  }
}

function flipCard(id) {
  if (isPaused || flippedCards.length === 2 || cards[id].isMatched || cards[id].isFlipped) return;

  const cardElement = document.querySelector(`[data-id="${id}"]`);
  if (cardElement) {
    playSound('flip');
    vibrate(50);
    cards[id].isFlipped = true;
    cardElement.classList.add('flipped', 'card-flip');
    cardElement.setAttribute('aria-label', `Kartu ${cards[id].emoji}`);
    flippedCards.push(id);
    
    if (flippedCards.length === 1) {
      lastFlipTime = Date.now();
    }

    if (flippedCards.length === 2) {
      setTimeout(checkMatch, 700);
    }
  }
}

function checkMatch() {
  const [firstId, secondId] = flippedCards;
  const firstCard = document.querySelector(`[data-id="${firstId}"]`);
  const secondCard = document.querySelector(`[data-id="${secondId}"]`);

  if (cards[firstId].emoji === cards[secondId].emoji) {
    cards[firstId].isMatched = true;
    cards[secondId].isMatched = true;
    cards[firstId].matchedBy = isMultiplayer ? currentPlayer : null;
    cards[secondId].matchedBy = isMultiplayer ? currentPlayer : null;
    if (firstCard) {
      firstCard.classList.add('matched');
      if (isMultiplayer) firstCard.classList.add(`player${currentPlayer + 1}`);
      animateMatchedCard(firstCard);
    }
    if (secondCard) {
      secondCard.classList.add('matched');
      if (isMultiplayer) secondCard.classList.add(`player${currentPlayer + 1}`);
      animateMatchedCard(secondCard);
    }
    matchedPairs.push([firstId, secondId]);
    
    const matchTime = Date.now() - lastFlipTime;
    let timeBonus = 0;
    if (matchTime < 1000) timeBonus = 50;
    else if (matchTime < 2000) timeBonus = 30;
    else if (matchTime < 3000) timeBonus = 10;
    
    comboCount++;
    const comboBonus = Math.floor(100 * Math.pow(COMBO_MULTIPLIER, comboCount - 1));
    const totalBonus = (100 + timeBonus + comboBonus) * DIFFICULTY_CONFIG[difficulty].speedMultiplier;
    
    if (isMultiplayer) {
      players[currentPlayer].score += totalBonus;
      document.getElementById(`player${currentPlayer + 1}-score`).textContent = players[currentPlayer].score;
      showFloatingText(firstCard, `+${totalBonus} untuk ${players[currentPlayer].name}!`);
    } else {
      score += totalBonus;
      document.getElementById('player1-score').textContent = score;
      if (timeBonus > 0) showFloatingText(firstCard, `+${timeBonus} CEPAT!`);
      if (comboCount > 1) showFloatingText(secondCard, `${comboBonus} COMBO x${comboCount}!`);
    }
    
    playSound('match');
  } else {
    if (firstCard) {
      firstCard.classList.add('wrong');
      setTimeout(() => {
        firstCard.classList.remove('wrong', 'flipped', 'card-flip');
        firstCard.setAttribute('aria-label', 'Kartu tertutup');
      }, 400);
    }
    if (secondCard) {
      secondCard.classList.add('wrong');
      setTimeout(() => {
        secondCard.classList.remove('wrong', 'flipped', 'card-flip');
        secondCard.setAttribute('aria-label', 'Kartu tertutup');
      }, 400);
    }
    cards[firstId].isFlipped = false;
    cards[secondId].isFlipped = false;
    if (!isMultiplayer) {
      lives--;
      document.getElementById('lives').textContent = lives;
    }
    comboCount = 0;
    if (isMultiplayer) {
      switchPlayer();
    }
    playSound('wrong');
  }
  flippedCards = [];
  updateProgress();
  checkGameOver();
}

function animateMatchedCard(card) {
  card.animate(
    [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.15)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    { duration: 400, easing: 'ease' }
  );
}

function switchPlayer() {
  currentPlayer = (currentPlayer + 1) % 2;
  const playerContainer = document.getElementById('current-player-container');
  playerContainer.classList.remove('player1', 'player2');
  playerContainer.classList.add(`player${currentPlayer + 1}`);
  playerContainer.classList.add('turn-transition');
  document.getElementById('current-player').textContent = players[currentPlayer].name;
  setTimeout(() => playerContainer.classList.remove('turn-transition'), 500);
}

function updateProgress() {
  const progress = document.getElementById('progress-bar');
  const percentage = (matchedPairs.length / (cards.length / 2)) * 100;
  progress.style.width = `${percentage}%`;
}

function showCardBriefly(id) {
  const cardElement = document.querySelector(`[data-id="${id}"]`);
  if (cardElement && !cards[id].isFlipped && !cards[id].isMatched) {
    cardElement.classList.add('flipped', 'card-flip');
    cards[id].isFlipped = true;
    cardElement.setAttribute('aria-label', `Kartu ${cards[id].emoji}`);
    setTimeout(() => {
      if (!cards[id].isMatched) {
        cardElement.classList.remove('flipped', 'card-flip');
        cards[id].isFlipped = false;
        cardElement.setAttribute('aria-label', 'Kartu tertutup');
      }
    }, 2000);
  }
}

function useHint() {
  if (isPaused || hintsRemaining <= 0 || flippedCards.length > 0) return;
  
  playSound('hint');
  vibrate(50);
  hintsRemaining--;
  document.getElementById('hints').textContent = hintsRemaining;
  document.getElementById('hint-button').disabled = hintsRemaining <= 0;
  
  const unmatched = cards.filter(card => !card.isMatched);
  if (unmatched.length <= 0) return;
  
  const availableEmojis = [...new Set(unmatched.map(card => card.emoji))];
  const randomEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
  
  const matchingCards = cards.filter(card => card.emoji === randomEmoji && !card.isMatched);
  
  matchingCards.forEach(card => {
    const cardElement = document.querySelector(`[data-id="${card.id}"]`);
    if (cardElement) {
      cardElement.classList.add('hint-flash');
      setTimeout(() => cardElement.classList.remove('hint-flash'), 800);
    }
  });
}

function usePowerUp(type) {
  if (isPaused || powerUpsUsed[type] || flippedCards.length > 0 || matchedPairs.length === cards.length / 2) return;
  
  powerUpsUsed[type] = true;
  document.getElementById(type).disabled = true;
  POWERUPS[type].effect();
  playSound('powerup');
  vibrate(50);
}

function checkAchievements() {
  const achievements = [];
  const timeUsed = DIFFICULTY_CONFIG[difficulty].time - timeLeft;
  if (!isMultiplayer) {
    if (timeUsed < 15 && !localStorage.getItem(`achievement_speedster_${difficulty}`)) {
      achievements.push('speedster');
      localStorage.setItem(`achievement_speedster_${difficulty}`, 'true');
    }
    if (lives === DIFFICULTY_CONFIG[difficulty].lives && !localStorage.getItem(`achievement_perfect_${difficulty}`)) {
      achievements.push('perfect');
      localStorage.setItem(`achievement_perfect_${difficulty}`, 'true');
    }
    if (comboCount >= 5 && !localStorage.getItem(`achievement_comboMaster_${difficulty}`)) {
      achievements.push('comboMaster');
      localStorage.setItem(`achievement_comboMaster_${difficulty}`, 'true');
    }
  } else {
    const winner = players[0].score > players[1].score ? 0 : players[0].score < players[1].score ? 1 : -1;
    if (winner !== -1 && !localStorage.getItem(`achievement_multiplayerChamp_${difficulty}_${players[winner].name}`)) {
      achievements.push('multiplayerChamp');
      localStorage.setItem(`achievement_multiplayerChamp_${difficulty}_${players[winner].name}`, 'true');
    }
  }
  
  if (achievements.length > 0) {
    showAchievementModal(achievements);
  }
  
  return achievements;
}

function showAchievementModal(achievements) {
  const modal = document.getElementById('achievement-modal');
  const text = document.getElementById('achievement-text');
  
  const achievement = ACHIEVEMENTS[achievements[0]];
  text.textContent = `${achievement.icon} ${achievement.title}: ${achievement.description}`;
  
  modal.classList.remove('hidden');
  playSound('win');
  vibrate(100);
  
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

function closeAchievementModal() {
  document.getElementById('achievement-modal').classList.add('hidden');
}

function updateLeaderboard(newScore, playerName, mode) {
  let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  leaderboard.push({
    name: playerName,
    score: newScore,
    difficulty,
    mode,
    date: new Date().toISOString()
  });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
  renderLeaderboard();
}

function renderLeaderboard() {
  const leaderboardBody = document.getElementById('leaderboard');
  const filter = document.getElementById('leaderboard-filter')?.value || 'all';
  let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');

  if (filter !== 'all') {
    leaderboard = leaderboard.filter(entry => entry.difficulty === filter);
  }

  leaderboardBody.innerHTML = '';
  if (leaderboard.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5" class="px-2 py-1 text-center">Belum ada skor untuk level ini.</td>`;
    leaderboardBody.appendChild(row);
    return;
  }

  leaderboard.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-2 py-1">${entry.name}</td>
      <td class="px-2 py-1">${entry.score}</td>
      <td class="px-2 py-1">${entry.difficulty}</td>
      <td class="px-2 py-1">${entry.mode}</td>
      <td class="px-2 py-1">${new Date(entry.date).toLocaleDateString('id-ID')}</td>
    `;
    leaderboardBody.appendChild(row);
  });
}

function shareScore() {
  let text;
  if (isMultiplayer) {
    const winner = players[0].score > players[1].score ? players[0].name : players[1].score > players[0].score ? players[1].name : 'Seri';
    text = `Keren! ${winner} menang di Memory Match Keren Multiplayer (${difficulty})! Skor: ${players[0].name}: ${players[0].score}, ${players[1].name}: ${players[1].score}. Ayo coba: https://memorymatchkeren.app`;
  } else {
    text = `Aku dapet ${score} di Memory Match Keren (${difficulty})! Coba kalahin aku: https://memorymatchkeren.app`;
  }
  if (navigator.share) {
    navigator.share({
      title: 'Memory Match Keren',
      text,
      url: 'https://memorymatchkeren.app'
    }).catch(err => {
      console.error('Share failed:', err);
      fallbackShare(text);
    });
  } else {
    fallbackShare(text);
  }
}

function fallbackShare(text) {
  navigator.clipboard.writeText(text).then(() => {
    showFloatingText(document.querySelector('#game-over'), 'Link disalin ke clipboard!');
  }).catch(err => {
    console.error('Clipboard failed:', err);
    alert('Salin manual: ' + text);
  });
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isPaused) {
      timeLeft--;
      document.getElementById('time-left').textContent = timeLeft;
      if (timeLeft <= 0 && !isMultiplayer) {
        endGame(false);
      }
      if (isMultiplayer && matchedPairs.length === cards.length / 2) {
        endGame(true);
      }
    }
  }, 1000);
}

function startGame(difficultyLevel) {
  try {
    isPaused = false;
    isMultiplayer = false;
    difficulty = difficultyLevel;
    currentTheme = document.getElementById('theme-select')?.value || 'classic';
    lives = DIFFICULTY_CONFIG[difficulty].lives;
    timeLeft = DIFFICULTY_CONFIG[difficulty].time;
    score = 0;
    hintsRemaining = 2;
    comboCount = 0;
    matchedPairs = [];
    flippedCards = [];
    powerUpsUsed = { timeFreeze: false, revealAll: false };

    document.getElementById('lives').textContent = lives;
    document.getElementById('time-left').textContent = timeLeft;
    document.getElementById('hints').textContent = hintsRemaining;
    document.getElementById('hint-button').disabled = false;
    document.getElementById('time-freeze').disabled = true;
    document.getElementById('reveal-all').disabled = true;
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('player1-score').textContent = score;
    document.getElementById('player1-name-label').textContent = playerName || 'Player 1';

    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
      console.error('Game area not found!');
      return;
    }

    document.getElementById('difficulty-select').classList.add('hidden');
    document.getElementById('player-name-input').classList.add('hidden');
    gameArea.classList.remove('hidden');
    document.getElementById('game-over').classList.add('hidden');

    createCards(difficulty);
    startTimer();

    setTimeout(() => {
      document.getElementById('time-freeze').disabled = false;
      document.getElementById('reveal-all').disabled = false;
    }, 5000);
  } catch (error) {
    console.error('Error starting game:', error);
    alert('Terjadi kesalahan saat memulai game. Cek console untuk detail.');
  }
}

function startMultiplayer() {
  try {
    const player1Name = document.getElementById('player1-name').value.trim();
    const player2Name = document.getElementById('player2-name').value.trim();

    if (!player1Name || !player2Name) {
      alert('Masukkan nama untuk kedua pemain!');
      return;
    }
    if (player1Name === player2Name) {
      alert('Nama pemain harus berbeda!');
      return;
    }

    isPaused = false;
    isMultiplayer = true;
    difficulty = document.getElementById('difficulty-select')?.value || 'easy';
    currentTheme = document.getElementById('theme-select')?.value || 'classic';

    players[0].name = player1Name || 'Player 1';
    players[1].name = player2Name || 'Player 2';
    players[0].score = 0;
    players[1].score = 0;

    document.getElementById('player1-name-label').textContent = players[0].name;
    document.getElementById('player2-name-label').textContent = players[1].name;
    document.getElementById('player1-score').textContent = players[0].score;
    document.getElementById('player2-score').textContent = players[1].score;

    lives = DIFFICULTY_CONFIG[difficulty].lives;
    timeLeft = DIFFICULTY_CONFIG[difficulty].time;
    hintsRemaining = 2;
    comboCount = 0;
    matchedPairs = [];
    flippedCards = [];
    powerUpsUsed = { timeFreeze: false, revealAll: false };

    document.getElementById('lives').textContent = lives;
    document.getElementById('time-left').textContent = timeLeft;
    document.getElementById('hints').textContent = hintsRemaining;
    document.getElementById('hint-button').disabled = false;
    document.getElementById('time-freeze').disabled = true;
    document.getElementById('reveal-all').disabled = true;
    document.getElementById('progress-bar').style.width = '0%';

    const gameArea = document.getElementById('game-area');
    if (!gameArea) {
      console.error('Game area not found!');
      return;
    }

    document.getElementById('multiplayer-name-input').classList.add('hidden');
    document.getElementById('difficulty-select').classList.add('hidden');
    gameArea.classList.remove('hidden');
    document.getElementById('game-over').classList.add('hidden');

    createCards(difficulty);
    startTimer();

    setTimeout(() => {
      document.getElementById('time-freeze').disabled = false;
      document.getElementById('reveal-all').disabled = false;
    }, 5000);
  } catch (error) {
    console.error('Error starting multiplayer:', error);
    alert('Terjadi kesalahan saat memulai multiplayer. Cek console untuk detail.');
  }
}

function savePlayerName() {
  playerName = document.getElementById('player-name').value.trim() || 'Player 1';
  document.getElementById('player-name-input').classList.add('hidden');
  document.getElementById('difficulty-select').classList.remove('hidden');
}

function toggleMode() {
  const mode = document.getElementById('mode-select').value;
  if (mode === 'multiplayer') {
    document.getElementById('multiplayer-name-input').classList.remove('hidden');
    document.getElementById('difficulty-select').classList.add('hidden');
  } else {
    document.getElementById('multiplayer-name-input').classList.add('hidden');
    document.getElementById('player-name-input').classList.remove('hidden');
  }
}

function pauseGame() {
  isPaused = true;
  document.getElementById('pause-menu').classList.remove('hidden');
}

function resumeGame() {
  isPaused = false;
  document.getElementById('pause-menu').classList.add('hidden');
}

function resetGame() {
  clearInterval(timerInterval);
  if (isMultiplayer) {
    startMultiplayer();
  } else {
    startGame(difficulty);
  }
}

function backToMenu() {
  clearInterval(timerInterval);
  document.getElementById('game-area').classList.add('hidden');
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('difficulty-select').classList.remove('hidden');
  if (isMultiplayer) {
    document.getElementById('multiplayer-name-input').classList.remove('hidden');
  } else {
    document.getElementById('player-name-input').classList.remove('hidden');
  }
}

function checkGameOver() {
  if (!isMultiplayer && (lives <= 0 || timeLeft <= 0)) {
    endGame(false);
  } else if (matchedPairs.length === cards.length / 2) {
    endGame(true);
  }
}

function endGame(isWin) {
  clearInterval(timerInterval);
  const gameOver = document.getElementById('game-over');
  const gameOverText = document.getElementById('game-over-text');
  const finalScore = document.getElementById('final-score');
  const finalPlayer1Score = document.getElementById('final-player1-score');
  const finalPlayer2Score = document.getElementById('final-player2-score');
  const highScoreElement = document.getElementById('high-score');
  const newHighScore = document.getElementById('new-high-score');
  const nextDifficultyElement = document.getElementById('next-difficulty');

  document.getElementById('game-area').classList.add('hidden');
  gameOver.classList.remove('hidden');

  if (isMultiplayer) {
    finalScore.classList.add('hidden');
    finalPlayer1Score.classList.remove('hidden');
    finalPlayer2Score.classList.remove('hidden');
    finalPlayer1Score.textContent = `${players[0].name}: ${players[0].score}`;
    finalPlayer2Score.textContent = `${players[1].name}: ${players[1].score}`;
    
    const winner = players[0].score > players[1].score ? players[0].name : players[1].score > players[0].score ? players[1].score : 'Seri';
    gameOverText.textContent = winner === 'Seri' ? 'Seri!' : `${winner} Menang!`;
    
    updateLeaderboard(players[0].score, players[0].name, 'multiplayer');
    updateLeaderboard(players[1].score, players[1].name, 'multiplayer');
  } else {
    finalScore.classList.remove('hidden');
    finalPlayer1Score.classList.add('hidden');
    finalPlayer2Score.classList.add('hidden');
    finalScore.textContent = score;
    
    gameOverText.textContent = isWin ? 'Kamu Menang!' : 'Game Over!';
    
    if (score > highScores[difficulty]) {
      highScores[difficulty] = score;
      localStorage.setItem('memoryMatchHighScores', JSON.stringify(highScores));
      newHighScore.classList.remove('hidden');
    } else {
      newHighScore.classList.add('hidden');
    }
    highScoreElement.textContent = highScores[difficulty];
    
    updateLeaderboard(score, playerName, 'single');
  }

  const difficulties = ['easy', 'medium', 'hard', 'expert'];
  const currentIndex = difficulties.indexOf(difficulty);
  if (isWin && currentIndex < difficulties.length - 1 && !isMultiplayer) {
    nextDifficultyElement.textContent = `Main di level ${difficulties[currentIndex + 1]}?`;
    nextDifficultyElement.classList.remove('hidden');
  } else {
    nextDifficultyElement.classList.add('hidden');
  }

  const newAchievements = checkAchievements();
  const achievementList = document.getElementById('achievement-list');
  const achievementsContainer = document.getElementById('achievements');
  achievementList.innerHTML = '';
  if (newAchievements.length > 0) {
    achievementsContainer.classList.remove('hidden');
    newAchievements.forEach(achievement => {
      const li = document.createElement('li');
      li.textContent = `${ACHIEVEMENTS[achievement].icon} ${ACHIEVEMENTS[achievement].title}`;
      achievementList.appendChild(li);
    });
  } else {
    achievementsContainer.classList.add('hidden');
  }

  playSound(isWin ? 'win' : 'lose');
  vibrate(isWin ? 200 : 100);

  if (isWin) {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  }
}

function nextDifficulty() {
  const difficulties = ['easy', 'medium', 'hard', 'expert'];
  const currentIndex = difficulties.indexOf(difficulty);
  if (currentIndex < difficulties.length - 1) {
    startGame(difficulties[currentIndex + 1]);
  }
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
  preloadSounds();
  renderLeaderboard();
  document.body.className = `theme-${currentTheme} ${darkMode ? 'dark-mode' : ''}`;

  const highScoreElements = document.querySelectorAll('.high-score-value');
  highScoreElements.forEach(element => {
    const diff = element.dataset.difficulty;
    element.textContent = highScores[diff] || 0;
  });

  toggleDarkMode();
});