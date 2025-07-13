# Dama Maroc – Traditional Moroccan Checkers

A modern, mobile-friendly web implementation of **Moroccan Dama** with local play, AI opponents, and real-time online multiplayer (Firebase).  
Deployed demo: https://dama-maroc-8bcff.web.app

## Features

* ⚔️  Player vs Player (same device)
* 🤖  Three-level AI (Novice, Strategist, Master)
* 🌐  Online multiplayer with room codes
* 📱  Fully responsive touch-optimized UI
* 🔄  Dark / Light / Wood / Neon themes

## Development

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Serve locally with Firebase emulators
firebase emulators:start
```

## Deployment

```bash
firebase deploy --only hosting
```

## License
MIT © 2023 Iliass Boukhiri 