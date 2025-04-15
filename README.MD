# Memory Match Keren 🎮

A modern and engaging memory card matching game built with HTML, CSS, and JavaScript.

## 📝 Description

Memory Match Keren is an interactive card matching game that features multiple difficulty levels, themes, and game modes. Challenge yourself in single-player mode or compete with friends in multiplayer!

## 🌟 Features

### Game Modes
- 🎮 Single Player
- 👥 Multiplayer (2 Players)

### Difficulty Levels
- 🟢 Easy (6 pairs, 60 seconds)
- 🟡 Medium (8 pairs, 45 seconds)
- 🔴 Hard (10 pairs, 30 seconds)
- ⭐ Expert (12 pairs, 25 seconds)

### Themes
- 🐾 Classic (Animals)
- 🍎 Fruits
- 🚀 Space

### Power-ups & Abilities
- ❄️ Time Freeze
- 👁️ Reveal All
- 💡 Hints System
- ⚡ Combo Multiplier

### Additional Features
- 🌓 Dark/Light Mode Toggle
- 🔊 Sound Effects Toggle
- 📊 Local Leaderboard
- 🏆 Achievement System
- 📱 Responsive Design

## 🎯 Achievements
- ⚡ Speedster: Complete level under 15 seconds
- 🌟 Perfect: Complete without mistakes
- 🔥 Combo Master: Get 5x combo
- 🏆 Multiplayer Champ: Win in multiplayer mode

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled

### Installation & Running
1. Clone the repository:
```bash
git clone https://github.com/yourusername/memory-match-keren.git
```

2. Navigate to project directory:
```bash
cd memory-match-keren
```

3. Open `index.html` in your browser or use a local server:
```bash
python -m http.server 8000
```

4. Access the game at `http://localhost:8000`

## 🎮 How to Play

1. **Starting the Game**
   - Choose game mode (Single/Multiplayer)
   - Select difficulty level
   - Pick a theme
   - Enter player name(s)

2. **Gameplay**
   - Click cards to flip them
   - Find matching pairs
   - Use power-ups strategically
   - Complete the level before time runs out

3. **Scoring System**
   - Base points for matches
   - Combo multipliers for consecutive matches
   - Time bonus for quick completion
   - Extra points for perfect games

## 💻 Technical Details

### Built With
- HTML5
- CSS3 (with Tailwind CSS)
- JavaScript
- Canvas Confetti for celebrations

### Key Features Implementation
- Local Storage for high scores
- CSS Animations and Transitions
- Responsive Design with Tailwind
- Custom Sound Effects System

## 🔧 Configuration

### Difficulty Settings
```javascript
const DIFFICULTY_CONFIG = {
  easy: { pairs: 6, time: 60, lives: 7 },
  medium: { pairs: 8, time: 45, lives: 5 },
  hard: { pairs: 10, time: 30, lives: 4 },
  expert: { pairs: 12, time: 25, lives: 3 }
};
```

## 🎨 Customization

### Adding New Themes
```javascript
const THEMES = {
  newTheme: {
    icons: ['emoji1', 'emoji2', ...],
    colors: ['primaryColor', 'secondaryColor']
  }
};
```

## 📱 Responsive Design

- Mobile-first approach
- Tablet optimization
- Desktop enhancement
- Touch-friendly controls

## 🔄 Updates & Maintenance

### Version History
- v1.0.0 - Initial Release
- v1.1.0 - Added Multiplayer
- v1.2.0 - Theme Support
- v1.3.0 - Power-ups System

## 👨‍💻 Developer

**Ahmad Danu Ilham Din (Kelompok 3)**
- Class: XI RPL 1
- Year: 2024

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details

## 🙏 Acknowledgments

- Tailwind CSS for styling
- Canvas Confetti for effects
- Google Fonts for typography