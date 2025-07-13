# 🏁 Dama Maroc - Traditional Moroccan Checkers

[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosted-orange?style=for-the-badge&logo=firebase)](https://dama-maroc-8bcff.web.app)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> A modern, mobile-friendly web implementation of **Moroccan Dama** (Traditional Checkers) featuring local multiplayer, intelligent AI opponents, and real-time online multiplayer capabilities.

## 🎮 [Live Demo](https://dama-maroc-8bcff.web.app)

## ✨ Features

### 🎯 Game Modes
- **👥 Player vs Player** - Local multiplayer on the same device
- **🤖 AI Opponents** - Three difficulty levels:
  - 🟢 **Novice** - Perfect for beginners
  - 🟡 **Strategist** - Balanced challenge
  - 🔴 **Master** - Advanced AI with strategic depth
- **🌐 Online Multiplayer** - Real-time gameplay with room codes

### 🎨 User Experience
- **📱 Fully Responsive** - Optimized for mobile, tablet, and desktop
- **🎨 Multiple Themes** - Light, Dark, Wood, and Neon themes
- **✋ Touch Optimized** - Smooth touch controls for mobile devices
- **🔄 Real-time Updates** - Live game state synchronization
- **📝 Move History** - Track and review game moves
- **⚡ Instant Feedback** - Visual move validation and highlights

### 🧠 Advanced AI Features
- **Strategic Thinking** - Multi-level decision making
- **Capture Optimization** - Prioritizes beneficial captures
- **Position Evaluation** - Analyzes board control and piece safety
- **Endgame Strategy** - Specialized late-game tactics
- **Performance Optimized** - Efficient algorithms for smooth gameplay

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for online multiplayer
- Node.js and npm (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/iboukhiri/dama-maroc-web.git
   cd dama-maroc-web
   ```

2. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

3. **Serve locally**
   ```bash
   # Option 1: Using Firebase emulators (recommended)
   firebase emulators:start
   
   # Option 2: Using any local server
   python -m http.server 8000
   # or
   npx serve .
   ```

4. **Open in browser**
   ```
   http://localhost:5000  # Firebase emulator
   http://localhost:8000  # Python server
   ```

## 🎮 How to Play

### Basic Rules
1. **Objective**: Capture all opponent pieces or block their moves
2. **Movement**: Pieces move diagonally on dark squares only
3. **Captures**: Jump over opponent pieces to capture them
4. **Kings**: Pieces reaching the opposite end become kings with enhanced movement
5. **Mandatory Captures**: Must capture when possible (Hezzek rule)

### Game Controls
- **Click/Tap** a piece to select it
- **Click/Tap** a highlighted square to move
- **Theme Toggle** - Switch between visual themes
- **Back to Menu** - Return to main menu anytime

## 🏗️ Project Structure

```
dama-maroc-web/
├── index.html              # Main game interface
├── script.js               # Core game logic and AI
├── styles.css              # Responsive styling and themes
├── online-multiplayer.js   # Firebase multiplayer integration
├── firebase-config.js      # Firebase configuration
├── firebase.json           # Firebase hosting config
└── public/
    └── index.html          # Firebase hosting entry point
```

## 🔧 Development

### Local Development
```bash
# Start Firebase emulators for full functionality
firebase emulators:start

# For frontend-only development
npx serve .
```

### Building for Production
```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or build for other hosting platforms
# (Copy all files except test-* and config files)
```

## 🌐 Online Multiplayer

The game features real-time multiplayer using Firebase Realtime Database:

- **Room-based System** - Create or join games with room codes
- **Real-time Synchronization** - Instant move updates
- **Connection Management** - Handles disconnections gracefully
- **Cross-platform** - Play across different devices

## 🎨 Themes

Choose from four beautiful themes:
- **☀️ Light** - Clean, bright interface
- **🌙 Dark** - Easy on the eyes
- **🌳 Wood** - Traditional wooden board feel
- **⚡ Neon** - Modern, vibrant colors

## 🤖 AI Implementation

The AI system features:
- **Minimax Algorithm** with Alpha-Beta pruning
- **Position Evaluation** considering:
  - Material advantage
  - Piece positioning
  - King mobility
  - Board control
  - Tactical patterns
- **Difficulty Scaling** through search depth and evaluation complexity
- **Performance Optimization** with time-limited searches

## 📱 Mobile Optimization

- **Responsive Design** - Adapts to all screen sizes
- **Touch Controls** - Optimized for finger interaction
- **Viewport Handling** - Proper mobile viewport configuration
- **Performance** - Smooth animations and interactions

## 🔄 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and device information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Iliass Boukhiri**
- GitHub: [@iboukhiri](https://github.com/iboukhiri)
- Email: [iliassboukhiri@gmail.com](mailto:iliassboukhiri@gmail.com)

## 🙏 Acknowledgments

- Traditional Moroccan Dama rules and gameplay
- Firebase for real-time multiplayer infrastructure
- Font Awesome for icons
- Google Fonts for typography

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/iboukhiri/dama-maroc-web?style=social)
![GitHub forks](https://img.shields.io/github/forks/iboukhiri/dama-maroc-web?style=social)
![GitHub issues](https://img.shields.io/github/issues/iboukhiri/dama-maroc-web)
![GitHub last commit](https://img.shields.io/github/last-commit/iboukhiri/dama-maroc-web)

---

<div align="center">
  <strong>🎮 Enjoy playing Dama Maroc! 🎮</strong>
  <br>
  <a href="https://dama-maroc-8bcff.web.app">Play Now</a> | 
  <a href="#-features">Features</a> | 
  <a href="#-quick-start">Quick Start</a> | 
  <a href="#-contributing">Contributing</a>
</div> 