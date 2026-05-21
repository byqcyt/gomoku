import { GameBoard, SIZE, EMPTY, BLACK, WHITE } from './game/GameBoard.js'
import { GomokuAI } from './game/GomokuAI.js'
import { GameMode } from './game/GameMode.js'

var CELL_SIZE = 22
var PADDING = 15
var BOARD_SIZE = PADDING * 2 + CELL_SIZE * (SIZE - 1)
var BTN_H = 36
var BTN_GAP = 10

export class GameMain {
  constructor(canvas, screenW, screenH, dpr) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.screenW = screenW
    this.screenH = screenH
    this.dpr = dpr
    this.ctx.scale(dpr, dpr)
    this.gameBoard = new GameBoard()
    this.mode = GameMode.PVE_MEDIUM
    this.modeIndex = 2
    this.aiThinking = false
    this.statusText = '当前回合：黑子'
    this.buttons = []
  }

  start() {
    this.layout()
    this.draw()
    this.bindTouch()
  }

  layout() {
    var boardX = Math.floor((this.screenW - BOARD_SIZE) / 2)
    var boardY = 20
    this.boardX = boardX
    this.boardY = boardY

    var modeNames = ['人人', '高级', '中级', '普通']
    var modeW = 56
    var modeStartX = Math.floor((this.screenW - (modeW * 4 + BTN_GAP * 3)) / 2)
    var modeY = boardY + BOARD_SIZE + 16

    this.buttons = []
    for (var i = 0; i < modeNames.length; i++) {
      this.buttons.push({
        x: modeStartX + i * (modeW + BTN_GAP),
        y: modeY,
        w: modeW,
        h: BTN_H,
        label: modeNames[i],
        action: 'mode',
        index: i
      })
    }

    var actionY = modeY + BTN_H + 12
    var actionW = 80
    var actionStartX = Math.floor((this.screenW - (actionW * 2 + BTN_GAP)) / 2)
    this.buttons.push({ x: actionStartX, y: actionY, w: actionW, h: BTN_H, label: '悔棋', action: 'undo' })
    this.buttons.push({ x: actionStartX + actionW + BTN_GAP, y: actionY, w: actionW, h: BTN_H, label: '重新开始', action: 'reset' })

    this.statusY = actionY + BTN_H + 16
  }

  draw() {
    var ctx = this.ctx
    ctx.fillStyle = '#F5F5F5'
    ctx.fillRect(0, 0, this.screenW, this.screenH)

    this.drawBoard()
    this.drawStatus()
    this.drawButtons()
  }

  drawBoard() {
    var ctx = this.ctx
    var x = this.boardX
    var y = this.boardY

    ctx.fillStyle = '#DEB887'
    ctx.fillRect(x, y, BOARD_SIZE, BOARD_SIZE)

    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (var i = 0; i < SIZE; i++) {
      var pos = PADDING + i * CELL_SIZE
      ctx.beginPath(); ctx.moveTo(x + PADDING, y + pos); ctx.lineTo(x + BOARD_SIZE - PADDING, y + pos); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x + pos, y + PADDING); ctx.lineTo(x + pos, y + BOARD_SIZE - PADDING); ctx.stroke()
    }

    var stars = [[3,3],[3,11],[7,7],[11,3],[11,11]]
    ctx.fillStyle = '#333'
    for (var s = 0; s < stars.length; s++) {
      var r = stars[s][0], c = stars[s][1]
      ctx.beginPath()
      ctx.arc(x + c * CELL_SIZE, y + r * CELL_SIZE, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    var radius = CELL_SIZE * 0.42
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var cell = this.gameBoard.getCell(r, c)
        if (cell === EMPTY) continue
        var cx = x + c * CELL_SIZE
        var cy = y + r * CELL_SIZE
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fillStyle = cell === BLACK ? '#000' : '#FFF'
        ctx.fill()
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    if (this.gameBoard.winLine) {
      var wl = this.gameBoard.winLine
      ctx.strokeStyle = 'red'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x + wl.sc * CELL_SIZE, y + wl.sr * CELL_SIZE)
      ctx.lineTo(x + wl.ec * CELL_SIZE, y + wl.er * CELL_SIZE)
      ctx.stroke()
    }
  }

  drawStatus() {
    var ctx = this.ctx
    ctx.fillStyle = '#333'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    var thinking = this.aiThinking ? '  (AI思考中...)' : ''
    ctx.fillText(this.statusText + thinking, this.screenW / 2, this.statusY)
  }

  drawButtons() {
    var ctx = this.ctx
    for (var i = 0; i < this.buttons.length; i++) {
      var b = this.buttons[i]
      if (b.action === 'mode' && b.index === this.modeIndex) {
        ctx.fillStyle = '#DEB887'
      } else {
        ctx.fillStyle = '#FFFFFF'
      }
      ctx.fillRect(b.x, b.y, b.w, b.h)
      ctx.strokeStyle = '#CCC'
      ctx.lineWidth = 1
      ctx.strokeRect(b.x, b.y, b.w, b.h)
      ctx.fillStyle = '#333'
      ctx.font = '13px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2)
    }
  }

  bindTouch() {
    var self = this
    wx.onTouchStart(function(e) {
      if (self.aiThinking) return
      var touch = e.touches[0]
      var tx = touch.clientX
      var ty = touch.clientY

      for (var i = 0; i < self.buttons.length; i++) {
        var b = self.buttons[i]
        if (tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h) {
          self.onButton(b)
          return
        }
      }

      if (self.gameBoard.gameOver) return

      var col = Math.round((tx - self.boardX - PADDING) / CELL_SIZE)
      var row = Math.round((ty - self.boardY - PADDING) / CELL_SIZE)
      if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return

      if (self.gameBoard.placeStone(row, col)) {
        self.updateStatus()
        self.draw()
        if (!self.gameBoard.gameOver && self.mode !== GameMode.PVP) {
          self.doAI()
        }
      }
    })
  }

  onButton(b) {
    if (b.action === 'mode') {
      var modes = [GameMode.PVP, GameMode.PVE_HARD, GameMode.PVE_MEDIUM, GameMode.PVE_EASY]
      this.mode = modes[b.index]
      this.modeIndex = b.index
      this.resetGame()
    } else if (b.action === 'undo') {
      this.onUndo()
    } else if (b.action === 'reset') {
      this.resetGame()
    }
  }

  onUndo() {
    if (this.aiThinking) return
    if (this.mode !== GameMode.PVP) {
      this.gameBoard.undoLastMove()
      this.gameBoard.undoLastMove()
    } else {
      this.gameBoard.undoLastMove()
    }
    this.updateStatus()
    this.draw()
  }

  resetGame() {
    this.gameBoard.reset()
    this.aiThinking = false
    this.updateStatus()
    this.draw()
  }

  doAI() {
    var self = this
    self.aiThinking = true
    self.draw()
    var snapshot = self.gameBoard.getBoardCopy()
    var ai = new GomokuAI(
      self.mode.depth,
      self.mode.range,
      self.mode.maxCandidates,
      self.mode.randomPick
    )
    setTimeout(function() {
      var move = ai.findBestMove(snapshot)
      if (move && !self.gameBoard.gameOver) {
        self.gameBoard.placeStone(move.row, move.col)
        self.updateStatus()
      }
      self.aiThinking = false
      self.draw()
    }, 100)
  }

  updateStatus() {
    if (this.gameBoard.gameOver) {
      var winner = this.gameBoard.winner === BLACK ? '黑子' : '白子'
      this.statusText = '游戏结束！' + winner + '获胜！'
    } else {
      var player = this.gameBoard.currentPlayer === BLACK ? '黑子' : '白子'
      this.statusText = '当前回合：' + player
    }
  }
}
