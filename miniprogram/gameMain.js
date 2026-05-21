var gb = require('./game/GameBoard.js')
var GameBoard = gb.GameBoard
var SIZE = gb.SIZE
var EMPTY = gb.EMPTY
var BLACK = gb.BLACK
var WHITE = gb.WHITE
var ai = require('./game/GomokuAI.js')
var GomokuAI = ai.GomokuAI
var gm = require('./game/GameMode.js')
var GameMode = gm.GameMode

var CELL = 22
var PAD = 15
var BOARD = PAD * 2 + CELL * (SIZE - 1)

function GameMain(canvas, screenW, screenH) {
  this.canvas = canvas
  this.ctx = canvas.getContext('2d')
  this.w = screenW
  this.h = screenH
  this.board = new GameBoard()
  this.mode = GameMode.PVE_MEDIUM
  this.modeIdx = 2
  this.thinking = false
  this.status = '当前回合：黑子'
  this.btns = []
}

GameMain.prototype.start = function() {
  this.initLayout()
  this.paint()
  this.listen()
}

GameMain.prototype.initLayout = function() {
  var bx = Math.floor((this.w - BOARD) / 2)
  var by = 15
  this.bx = bx
  this.by = by

  var names = ['人人', '高级', '中级', '普通']
  var bw = 54
  var gap = 8
  var mx = Math.floor((this.w - (bw * 4 + gap * 3)) / 2)
  var my = by + BOARD + 12

  this.btns = []
  for (var i = 0; i < 4; i++) {
    this.btns.push({ x: mx + i * (bw + gap), y: my, w: bw, h: 32, text: names[i], act: 'mode', idx: i })
  }

  var ay = my + 40
  var aw = 76
  var ax = Math.floor((this.w - (aw * 2 + gap)) / 2)
  this.btns.push({ x: ax, y: ay, w: aw, h: 32, text: '悔棋', act: 'undo' })
  this.btns.push({ x: ax + aw + gap, y: ay, w: aw, h: 32, text: '重新开始', act: 'reset' })

  this.statusY = ay + 44
}

GameMain.prototype.paint = function() {
  var ctx = this.ctx
  ctx.fillStyle = '#F5F5F5'
  ctx.fillRect(0, 0, this.w, this.h)
  this.paintBoard()
  this.paintStatus()
  this.paintBtns()
}

GameMain.prototype.paintBoard = function() {
  var ctx = this.ctx
  var ox = this.bx
  var oy = this.by

  ctx.fillStyle = '#DEB887'
  ctx.fillRect(ox, oy, BOARD, BOARD)

  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  for (var i = 0; i < SIZE; i++) {
    var p = PAD + i * CELL
    ctx.beginPath()
    ctx.moveTo(ox + PAD, oy + p)
    ctx.lineTo(ox + PAD + (SIZE - 1) * CELL, oy + p)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(ox + p, oy + PAD)
    ctx.lineTo(ox + p, oy + PAD + (SIZE - 1) * CELL)
    ctx.stroke()
  }

  var stars = [[3,3],[3,11],[7,7],[11,3],[11,11]]
  ctx.fillStyle = '#333'
  for (var s = 0; s < 5; s++) {
    var r = stars[s][0], c = stars[s][1]
    ctx.beginPath()
    ctx.arc(ox + PAD + c * CELL, oy + PAD + r * CELL, 3, 0, 6.3)
    ctx.fill()
  }

  var rad = CELL * 0.42
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var v = this.board.getCell(r, c)
      if (v === EMPTY) continue
      var cx = ox + PAD + c * CELL
      var cy = oy + PAD + r * CELL
      ctx.beginPath()
      ctx.arc(cx, cy, rad, 0, 6.3)
      ctx.fillStyle = v === BLACK ? '#000' : '#FFF'
      ctx.fill()
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  if (this.board.winLine) {
    var wl = this.board.winLine
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(ox + PAD + wl.sc * CELL, oy + PAD + wl.sr * CELL)
    ctx.lineTo(ox + PAD + wl.ec * CELL, oy + PAD + wl.er * CELL)
    ctx.stroke()
  }
}

GameMain.prototype.paintStatus = function() {
  var ctx = this.ctx
  ctx.fillStyle = '#333'
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  var t = this.thinking ? this.status + ' (AI思考中...)' : this.status
  ctx.fillText(t, this.w / 2, this.statusY)
}

GameMain.prototype.paintBtns = function() {
  var ctx = this.ctx
  for (var i = 0; i < this.btns.length; i++) {
    var b = this.btns[i]
    ctx.fillStyle = (b.act === 'mode' && b.idx === this.modeIdx) ? '#DEB887' : '#FFF'
    ctx.fillRect(b.x, b.y, b.w, b.h)
    ctx.strokeStyle = '#CCC'
    ctx.lineWidth = 1
    ctx.strokeRect(b.x, b.y, b.w, b.h)
    ctx.fillStyle = '#333'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(b.text, b.x + b.w / 2, b.y + b.h / 2)
  }
}

GameMain.prototype.listen = function() {
  var self = this
  wx.onTouchStart(function(e) {
    if (self.thinking) return
    var tx = e.touches[0].clientX
    var ty = e.touches[0].clientY

    for (var i = 0; i < self.btns.length; i++) {
      var b = self.btns[i]
      if (tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h) {
        self.clickBtn(b)
        return
      }
    }

    if (self.board.gameOver) return

    var dx = tx - self.bx - PAD
    var dy = ty - self.by - PAD
    var col = Math.round(dx / CELL)
    var row = Math.round(dy / CELL)
    if (col < 0 || col >= SIZE || row < 0 || row >= SIZE) return

    if (self.board.placeStone(row, col)) {
      self.updateStatus()
      self.paint()
      if (!self.board.gameOver && self.mode !== GameMode.PVP) {
        self.doAI()
      }
    }
  })
}

GameMain.prototype.clickBtn = function(b) {
  if (b.act === 'mode') {
    var ms = [GameMode.PVP, GameMode.PVE_HARD, GameMode.PVE_MEDIUM, GameMode.PVE_EASY]
    this.mode = ms[b.idx]
    this.modeIdx = b.idx
    this.resetGame()
  } else if (b.act === 'undo') {
    if (this.thinking) return
    if (this.mode !== GameMode.PVP) { this.board.undoLastMove(); this.board.undoLastMove() }
    else { this.board.undoLastMove() }
    this.updateStatus()
    this.paint()
  } else if (b.act === 'reset') {
    this.resetGame()
  }
}

GameMain.prototype.resetGame = function() {
  this.board.reset()
  this.thinking = false
  this.updateStatus()
  this.paint()
}

GameMain.prototype.doAI = function() {
  var self = this
  self.thinking = true
  self.paint()
  var snap = self.board.getBoardCopy()
  var gai = new GomokuAI(self.mode.depth, self.mode.range, self.mode.maxCandidates, self.mode.randomPick)
  setTimeout(function() {
    var mv = gai.findBestMove(snap)
    if (mv && !self.board.gameOver) {
      self.board.placeStone(mv.row, mv.col)
      self.updateStatus()
    }
    self.thinking = false
    self.paint()
  }, 100)
}

GameMain.prototype.updateStatus = function() {
  if (this.board.gameOver) {
    var w = this.board.winner === BLACK ? '黑子' : '白子'
    this.status = '游戏结束！' + w + '获胜！'
  } else {
    var p = this.board.currentPlayer === BLACK ? '黑子' : '白子'
    this.status = '当前回合：' + p
  }
}

module.exports = { GameMain: GameMain }
