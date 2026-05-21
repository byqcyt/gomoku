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

function GameMain(canvas, screenW, screenH, dpr) {
  this.canvas = canvas
  this.ctx = canvas.getContext('2d')
  this.w = screenW
  this.h = screenH
  this.dpr = dpr
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
  var totalH = BOARD + 12 + 32 + 8 + 32 + 44
  var by = Math.floor((this.h - totalH) / 2)
  var bx = Math.floor((this.w - BOARD) / 2)
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
  var d = this.dpr
  ctx.fillStyle = '#F5F5F5'
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  this.paintBoard()
  this.paintStatus()
  this.paintBtns()
}

GameMain.prototype.paintBoard = function() {
  var ctx = this.ctx
  var d = this.dpr
  var ox = this.bx * d
  var oy = this.by * d
  var bsz = BOARD * d
  var pad = PAD * d
  var cell = CELL * d

  ctx.fillStyle = '#DEB887'
  ctx.fillRect(ox, oy, bsz, bsz)

  ctx.strokeStyle = '#333'
  ctx.lineWidth = d
  for (var i = 0; i < SIZE; i++) {
    var p = pad + i * cell
    ctx.beginPath()
    ctx.moveTo(ox + pad, oy + p)
    ctx.lineTo(ox + pad + (SIZE - 1) * cell, oy + p)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(ox + p, oy + pad)
    ctx.lineTo(ox + p, oy + pad + (SIZE - 1) * cell)
    ctx.stroke()
  }

  var stars = [[3,3],[3,11],[7,7],[11,3],[11,11]]
  ctx.fillStyle = '#333'
  for (var s = 0; s < 5; s++) {
    var r = stars[s][0], c = stars[s][1]
    ctx.beginPath()
    ctx.arc(ox + pad + c * cell, oy + pad + r * cell, 3 * d, 0, 6.3)
    ctx.fill()
  }

  var rad = cell * 0.42
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var v = this.board.getCell(r, c)
      if (v === EMPTY) continue
      var cx = ox + pad + c * cell
      var cy = oy + pad + r * cell
      ctx.beginPath()
      ctx.arc(cx, cy, rad, 0, 6.3)
      ctx.fillStyle = v === BLACK ? '#000' : '#FFF'
      ctx.fill()
      ctx.strokeStyle = '#555'
      ctx.lineWidth = d
      ctx.stroke()
    }
  }

  if (this.board.winLine) {
    var wl = this.board.winLine
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 3 * d
    ctx.beginPath()
    ctx.moveTo(ox + pad + wl.sc * cell, oy + pad + wl.sr * cell)
    ctx.lineTo(ox + pad + wl.ec * cell, oy + pad + wl.er * cell)
    ctx.stroke()
  }
}

GameMain.prototype.paintStatus = function() {
  var ctx = this.ctx
  var d = this.dpr
  ctx.fillStyle = '#333'
  ctx.font = (14 * d) + 'px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  var t = this.thinking ? this.status + ' (AI思考中...)' : this.status
  ctx.fillText(t, (this.w / 2) * d, this.statusY * d)
}

GameMain.prototype.paintBtns = function() {
  var ctx = this.ctx
  var d = this.dpr
  for (var i = 0; i < this.btns.length; i++) {
    var b = this.btns[i]
    ctx.fillStyle = (b.act === 'mode' && b.idx === this.modeIdx) ? '#DEB887' : '#FFF'
    ctx.fillRect(b.x * d, b.y * d, b.w * d, b.h * d)
    ctx.strokeStyle = '#CCC'
    ctx.lineWidth = d
    ctx.strokeRect(b.x * d, b.y * d, b.w * d, b.h * d)
    ctx.fillStyle = '#333'
    ctx.font = (13 * d) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(b.text, (b.x + b.w / 2) * d, (b.y + b.h / 2) * d)
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
