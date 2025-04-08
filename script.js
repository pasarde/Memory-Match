const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🦓', '🐝', '🦋', '🐙'];
const DIFFICULTY_CONFIG = {
  easy: { pairs: 6, time: 60, lives: 7 },
  medium: { pairs: 8, time: 45, lives: 5 },
  hard: { pairs: 10, time: 30, lives: 4 },
  expert: { pairs: 12, time: 25, lives: 3 }
};

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
let highScores = JSON.parse(localStorage.getItem('memoryMatchHighScores')) || {
  easy: 0,
  medium: 0,
  hard: 0,
  expert: 0
};

// Preload sounds
const sounds = {
  flip: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3'),
  match: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bonus-earned-in-video-game-2058.mp3'),
  wrong: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-negative-tone-interface-tap-2569.mp3'),
  win: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3'),
  lose: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3'),
  hint: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magical-coin-win-1936.mp3')
};

// Load sounds
Object.values(sounds).forEach(sound => {
  sound.load();
  sound.volume = 0.5;
});

function createCards(difficultyLevel) {
  const numPairs = DIFFICULTY_CONFIG[difficultyLevel].pairs;
  const selectedEmojis = EMOJIS.slice(0, numPairs);
  const pairs = [...selectedEmojis, ...selectedEmojis];
  cards = pairs.sort(() => Math.random() - 0.5).map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false
  }));
  renderCards();
}

function renderCards() {
  const gameBoard = document.getElementById('game-board');
  if (!gameBoard) {
    console.error('Game board not found!');
    return;
  }
  gameBoard.innerHTML = '';
  
  let gridClass;
  switch (difficulty) {
    case 'easy':
      gridClass = 'grid-cols-3 md:grid-cols-4';
      break;
    case 'medium':
      gridClass = 'grid-cols-4 md:grid-cols-4';
      break;
    case 'hard':
      gridClass = 'grid-cols-4 md:grid-cols-5';
      break;
    case 'expert':
      gridClass = 'grid-cols-4 md:grid-cols-6';
      break;
    default:
      gridClass = 'grid-cols-4';
  }
  
  gameBoard.className = `grid ${gridClass} gap-4 justify-center`;

  let delay = 0;
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card relative opacity-0';
    cardElement.style.animation = `fadeIn 0.5s ease forwards ${delay}s`;
    cardElement.dataset.id = card.id;
    delay += 0.05;

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

    if (card.isMatched) cardElement.classList.add('matched');
    if (card.isFlipped) cardElement.classList.add('flipped');

    cardElement.addEventListener('click', () => flipCard(card.id));
    gameBoard.appendChild(cardElement);
  });
  
  // Create or update CSS animation
  let styleElement = document.getElementById('game-animations');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'game-animations';
    document.head.appendChild(styleElement);
  }
  
  styleElement.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    @keyframes sparkle {
      0% { box-shadow: 0 0 0 rgba(74, 222, 128, 0); }
      50% { box-shadow: 0 0 20px rgba(74, 222, 128, 0.8); }
      100% { box-shadow: 0 0 0 rgba(74, 222, 128, 0); }
    }
  `;
}

function flipCard(id) {
  if (flippedCards.length === 2 || cards[id].isMatched || cards[id].isFlipped) return;

  const cardElement = document.querySelector(`[data-id="${id}"]`);
  if (cardElement) {
    playSound('flip');
    cards[id].isFlipped = true;
    cardElement.classList.add('flipped');
    flippedCards.push(id);
    
    // Record the time of the flip
    if (flippedCards.length === 1) {
      lastFlipTime = Date.now();
    }

    if (flippedCards.length === 2) {
      setTimeout(checkMatch, 800);
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
    if (firstCard) {
      firstCard.classList.add('matched');
      animateMatchedCard(firstCard);
    }
    if (secondCard) {
      secondCard.classList.add('matched');
      animateMatchedCard(secondCard);
    }
    matchedPairs.push([firstId, secondId]);
    
    // Calculate bonus points for quick matches
    const matchTime = Date.now() - lastFlipTime;
    let timeBonus = 0;
    if (matchTime < 1000) {
      timeBonus = 50;
    } else if (matchTime < 2000) {
      timeBonus = 30;
    } else if (matchTime < 3000) {
      timeBonus = 10;
    }
    
    score += 100 + timeBonus;
    
    // Show bonus if applicable
    if (timeBonus > 0) {
      showFloatingText(firstCard, `+${timeBonus} CEPAT!`);
    }
    
    document.getElementById('score').textContent = score;
    playSound('match');
  } else {
    if (firstCard) {
      firstCard.classList.add('wrong');
      setTimeout(() => {
        firstCard.classList.remove('wrong', 'flipped');
      }, 500);
    }
    if (secondCard) {
      secondCard.classList.add('wrong');
      setTimeout(() => {
        secondCard.classList.remove('wrong', 'flipped');
      }, 500);
    }
    cards[firstId].isFlipped = false;
    cards[secondId].isFlipped = false;
    lives--;
    document.getElementById('lives').textContent = lives;
    playSound('wrong');
  }
  flippedCards = [];
  updateProgress();
  checkGameOver();
}

function showFloatingText(element, text) {
  const rect = element.getBoundingClientRect();
  const floatingText = document.createElement('div');
  floatingText.className = 'floating-text';
  floatingText.textContent = text;
  floatingText.style.position = 'absolute';
  floatingText.style.top = `${rect.top - 20}px`;
  floatingText.style.left = `${rect.left + rect.width/2 - 40}px`;
  document.body.appendChild(floatingText);
  
  // Animate and remove
  setTimeout(() => {
    floatingText.remove();
  }, 1500);
}

function animateMatchedCard(card) {
  card.animate(
    [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.2)', opacity: 1 },
      { transform: 'scale(0.95)', opacity: 1 }
    ],
    {
      duration: 500,
      easing: 'ease'
    }
  );
  
  // Add sparkle animation
  card.style.animation = 'sparkle 1s ease';
  setTimeout(() => {
    card.style.animation = '';
  }, 1000);
}

function updateProgress() {
  const progress = document.getElementById('progress-bar');
  const percentage = (matchedPairs.length / (cards.length / 2)) * 100;
  progress.style.width = `${percentage}%`;
}

function startGame(selectedDifficulty) {
  difficulty = selectedDifficulty;
  
  const difficultySelect = document.getElementById('difficulty-select');
  const gameArea = document.getElementById('game-area');
  
  difficultySelect.style.opacity = '0';
  difficultySelect.style.transform = 'translateY(-20px)';
  
  setTimeout(() => {
    difficultySelect.classList.add('hidden');
    gameArea.classList.remove('hidden');
    document.getElementById('game-over').classList.add('hidden');
    
    gameArea.style.opacity = '0';
    gameArea.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      gameArea.style.opacity = '1';
      gameArea.style.transform = 'translateY(0)';
    }, 50);
  }, 300);
  
  matchedPairs = [];
  flippedCards = [];
  lives = DIFFICULTY_CONFIG[selectedDifficulty].lives;
  score = 0;
  timeLeft = DIFFICULTY_CONFIG[selectedDifficulty].time;
  hintsRemaining = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
  
  document.getElementById('lives').textContent = lives;
  document.getElementById('score').textContent = score;
  document.getElementById('time-left').textContent = timeLeft;
  document.getElementById('hints').textContent = hintsRemaining;
  document.getElementById('progress-bar').style.width = '0%';
  
  createCards(selectedDifficulty);
  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('time-left').textContent = timeLeft;
    
    // Warning when time is running low
    if (timeLeft <= 10) {
      document.getElementById('time-left').classList.add('text-red-600', 'font-bold');
    } else {
      document.getElementById('time-left').classList.remove('text-red-600', 'font-bold');
    }
    
    if (timeLeft <= 0) clearInterval(timerInterval);
    checkGameOver();
  }, 1000);
}

function checkGameOver() {
  if (lives <= 0 || timeLeft <= 0 || matchedPairs.length === cards.length / 2) {
    clearInterval(timerInterval);
    
    const gameArea = document.getElementById('game-area');
    const gameOver = document.getElementById('game-over');
    
    // Check if game is won
    const isWin = lives > 0 && matchedPairs.length === cards.length / 2;
    
    // Update high score if needed
    if (isWin && score > highScores[difficulty]) {
      highScores[difficulty] = score;
      localStorage.setItem('memoryMatchHighScores', JSON.stringify(highScores));
      document.getElementById('new-high-score').classList.remove('hidden');
    } else {
      document.getElementById('new-high-score').classList.add('hidden');
    }
    
    // Show current and high score
    document.getElementById('final-score').textContent = score;
    document.getElementById('high-score').textContent = highScores[difficulty];
    
    gameArea.style.opacity = '0';
    gameArea.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
      gameArea.classList.add('hidden');
      gameOver.classList.remove('hidden');
      
      gameOver.style.opacity = '0';
      gameOver.style.transform = 'translateY(20px)';
      
      document.getElementById('game-over-text').textContent = 
        isWin ? 'Selamat, Menang! 🎉' : 'Game Over! 😢';
      
      // Suggestion for next difficulty level
      const nextDifficultyElement = document.getElementById('next-difficulty');
      if (isWin) {
        if (difficulty === 'easy') {
          nextDifficultyElement.textContent = 'Coba tingkat "Sedang" selanjutnya?';
          nextDifficultyElement.classList.remove('hidden');
        } else if (difficulty === 'medium') {
          nextDifficultyElement.textContent = 'Berani coba tingkat "Sulit"?';
          nextDifficultyElement.classList.remove('hidden');
        } else if (difficulty === 'hard') {
          nextDifficultyElement.textContent = 'Siap untuk tantangan "Expert"?';
          nextDifficultyElement.classList.remove('hidden');
        } else {
          nextDifficultyElement.classList.add('hidden');
        }
      } else {
        nextDifficultyElement.classList.add('hidden');
      }
      
      setTimeout(() => {
        gameOver.style.opacity = '1';
        gameOver.style.transform = 'translateY(0)';
        if (isWin) {
          playSound('win');
        } else {
          playSound('lose');
        }
      }, 50);
    }, 300);
  }
}

function useHint() {
  if (hintsRemaining <= 0 || flippedCards.length > 0) return;
  
  playSound('hint');
  hintsRemaining--;
  document.getElementById('hints').textContent = hintsRemaining;
  
  // Find two matching cards that aren't matched yet
  const unmatched = cards.filter(card => !card.isMatched);
  if (unmatched.length <= 0) return;
  
  // Get a random emoji that hasn't been matched
  const availableEmojis = [...new Set(unmatched.map(card => card.emoji))];
  const randomEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
  
  // Find all cards with this emoji
  const matchingCards = cards.filter(card => card.emoji === randomEmoji && !card.isMatched);
  
  // Flash these cards
  matchingCards.forEach(card => {
    const cardElement = document.querySelector(`[data-id="${card.id}"]`);
    if (cardElement) {
      cardElement.classList.add('hint-flash');
      setTimeout(() => {
        cardElement.classList.remove('hint-flash');
      }, 1000);
    }
  });
}

function resetGame() {
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('difficulty-select').classList.remove('hidden');
  
  const difficultySelect = document.getElementById('difficulty-select');
  difficultySelect.style.opacity = '1';
  difficultySelect.style.transform = 'translateY(0)';
  
  cards = [];
  flippedCards = [];
  matchedPairs = [];
  lives = 3;
  score = 0;
  timeLeft = 0;
  clearInterval(timerInterval);
}

function nextDifficulty() {
  let nextLevel;
  if (difficulty === 'easy') nextLevel = 'medium';
  else if (difficulty === 'medium') nextLevel = 'hard';
  else if (difficulty === 'hard') nextLevel = 'expert';
  else nextLevel = 'easy';
  
  document.getElementById('game-over').classList.add('hidden');
  startGame(nextLevel);
}

function backToMenu() {
  clearInterval(timerInterval);
  
  const gameArea = document.getElementById('game-area');
  const gameOver = document.getElementById('game-over');
  const difficultySelect = document.getElementById('difficulty-select');
  
  if (!gameArea.classList.contains('hidden')) {
    gameArea.style.opacity = '0';
    gameArea.style.transform = 'translateY(-20px)';
  }
  
  if (!gameOver.classList.contains('hidden')) {
    gameOver.style.opacity = '0';
    gameOver.style.transform = 'translateY(-20px)';
  }
  
  setTimeout(() => {
    gameArea.classList.add('hidden');
    gameOver.classList.add('hidden');
    difficultySelect.classList.remove('hidden');
    
    difficultySelect.style.opacity = '0';
    difficultySelect.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      difficultySelect.style.opacity = '1';
      difficultySelect.style.transform = 'translateY(0)';
    }, 50);
  }, 300);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const soundIcon = document.getElementById('sound-icon');
  soundIcon.innerHTML = soundEnabled 
    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M12 9.999a2 2 0 010 4M19.07 4.93a9 9 0 010 14.14M5 10.5A.5.5 0 015.5 10H9a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H5.5a.5.5 0 01-.5-.5v-3z"></path>'
    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>';
}

function playSound(type) {
  if (!soundEnabled) return;
  
  // Stop the sound first (in case it's already playing)
  const sound = sounds[type];
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(error => {
      console.log('Sound play failed:', error);
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const elements = ['difficulty-select', 'game-area', 'game-over'];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.transition = 'all 0.3s ease';
    }
  });
  
  // Update high scores on page load
  const highScoreElements = document.querySelectorAll('.high-score-value');
  highScoreElements.forEach(el => {
    const diff = el.dataset.difficulty;
    if (diff && highScores[diff] !== undefined) {
      el.textContent = highScores[diff];
    }
  });
});