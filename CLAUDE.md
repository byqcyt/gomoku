# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gomoku (五子棋) game with three implementations:
- **Java Swing desktop app** (`src/main/java/org/example/gomoku/`) — original version, Maven-based
- **WeChat Mini Game (小游戏)** (`miniprogram/`) — active development focus, pure Canvas rendering
- **Android app** (`android/`) — Flutter-based

## Build & Run

### Java Desktop (Maven)
```bash
mvn package          # build jar
mvn exec:java -Dexec.mainClass="org.example.gomoku.GomokuApp"
```

### WeChat Mini Game
No build step. Open `miniprogram/` directory in **WeChat Developer Tools** (微信开发者工具). The AppID is game-type (`compileType: "game"`).

## WeChat Mini Game Architecture

### Critical Constraints
- **CommonJS only** — use `require()`/`module.exports`, ES6 `import` is NOT supported in game logic
- **No DOM/BOM APIs** — no `document`, `window`, `Array.from`, `Infinity` in `miniprogram/game/` files
- **Pure Canvas rendering** — no WXML/WXSS, all UI drawn on a single canvas via `ctx` 2D context
- **Manual DPR handling** — all drawing coordinates must be manually multiplied by `this.dpr`; do NOT use `ctx.scale()`
- **`wx.createUserInfoButton`** is the only way to get user info in mini games (not `wx.getUserProfile`)

### File Structure
```
miniprogram/
  game.js          # Entry point: creates canvas, initializes GameMain, handles wx.onAppShow
  gameMain.js      # Main game: UI rendering, touch events, state management, auth
  game.json        # Mini game config (portrait, no status bar)
  project.config.json  # WeChat project config, appid: wxb64dcc9f86549bf3
  game/
    GameBoard.js   # 15x15 board state, place/undo/win detection
    GomokuAI.js    # Minimax + alpha-beta pruning AI
    GameMode.js    # 4 modes: PVP, PVE_HARD (depth 4), PVE_MEDIUM (depth 3), PVE_EASY (depth 1)
  audio/
    place.wav      # Stone placement sound
    win.wav        # Win sound
```

### Key Patterns
- **Prototype-based OOP** — all classes use `function Constructor() {}` + `Constructor.prototype.method`
- **Canvas coordinate system** — `CELL=22`, `PAD=15`, `BOARD=PAD*2+CELL*(SIZE-1)`, stones drawn at grid intersections
- **Game state flow** — `welcome` → `guide` (first time) → `playing`
- **User auth** — `wx.createUserInfoButton` creates a transparent native button overlay on canvas; canvas draws the visible button
- **Persistence** — `wx.getStorageSync`/`setStorageSync` for game stats (`game_stats`), user info (`user_info`), guide state (`guide_dismissed`)

### Touch Coordinate System
Touch events use CSS pixels (`e.touches[0].clientX`), same as `this.w`/`this.h`. Drawing uses `* this.dpr`. Both board position (`this.bx`, `this.by`) and cell size (`CELL`) are in CSS pixels, so touch-to-grid mapping uses CSS pixel math directly.
