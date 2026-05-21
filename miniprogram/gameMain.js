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

  this.page = 'welcome'
  this.nickName = '游客'
  this.avatarImg = null
  this.authed = false
  this.guideDismissed = false

  this.loadGuideState()
}

GameMain.prototype.start = function() {
  this.initLayout()
  this.paint()
  this.listen()
}

GameMain.prototype.loadGuideState = function() {
  try {
    this.guideDismissed = wx.getStorageSync('guide_dismissed') === true
  } catch (e) {
    this.guideDismissed = false
  }
}

GameMain.prototype.saveGuideState = function() {
  try {
    wx.setStorageSync('guide_dismissed', true)
  } catch (e) {}
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

  // 欢迎页按钮
  var btnW = 180
  var btnH = 44
  this.welcomeBtn = {
    x: Math.floor((this.w - btnW) / 2),
    y: Math.floor(this.h * 0.55),
    w: btnW,
    h: btnH
  }
  this.enterBtn = {
    x: Math.floor((this.w - btnW) / 2),
    y: Math.floor(this.h * 0.65),
    w: btnW,
    h: btnH
  }

  // 引导页按钮
  var guideBtnW = 140
  this.guideBtn = {
    x: Math.floor((this.w - guideBtnW) / 2),
    y: Math.floor(this.h * 0.75),
    w: guideBtnW,
    h: 40
  }
}

// ========== 绘制 ==========

GameMain.prototype.paint = function() {
  if (this.page === 'welcome') {
    this.paintWelcome()
  } else {
    this.paintGame()
    if (this.page === 'guide') {
      this.paintGuide()
    }
  }
}

GameMain.prototype.paintWelcome = function() {
  var ctx = this.ctx
  var d = this.dpr
  var w = this.w * d
  var h = this.h * d

  // 背景
  ctx.fillStyle = '#2C3E50'
  ctx.fillRect(0, 0, w, h)

  // 标题
  ctx.fillStyle = '#ECF0F1'
  ctx.font = 'bold ' + (42 * d) + 'px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('五子棋', w / 2, h * 0.2)

  // 副标题
  ctx.fillStyle = '#95A5A6'
  ctx.font = (16 * d) + 'px sans-serif'
  ctx.fillText('经典策略对弈游戏', w / 2, h * 0.27)

  // 头像
  var avatarR = 40 * d
  var avatarY = h * 0.38
  if (this.avatarImg) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(w / 2, avatarY, avatarR, 0, 6.3)
    ctx.clip()
    ctx.drawImage(this.avatarImg, w / 2 - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2)
    ctx.restore()
  } else {
    ctx.fillStyle = '#7F8C8D'
    ctx.beginPath()
    ctx.arc(w / 2, avatarY, avatarR, 0, 6.3)
    ctx.fill()
    // 默认头像图标
    ctx.fillStyle = '#BDC3C7'
    ctx.beginPath()
    ctx.arc(w / 2, avatarY - 8 * d, 14 * d, 0, 6.3)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(w / 2, avatarY + 24 * d, 22 * d, 3.14, 0)
    ctx.fill()
  }

  // 昵称
  ctx.fillStyle = '#ECF0F1'
  ctx.font = (18 * d) + 'px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(this.nickName, w / 2, h * 0.47)

  // 开始游戏按钮
  var btn = this.welcomeBtn
  ctx.fillStyle = '#E74C3C'
  this.roundRect(ctx, btn.x * d, btn.y * d, btn.w * d, btn.h * d, 8 * d)
  ctx.fill()
  ctx.fillStyle = '#FFF'
  ctx.font = 'bold ' + (18 * d) + 'px sans-serif'
  ctx.fillText(this.authed ? '进入游戏' : '开始游戏', (btn.x + btn.w / 2) * d, (btn.y + btn.h / 2) * d)

  // 授权按钮（未授权时显示）
  if (!this.authed) {
    var ebtn = this.enterBtn
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    this.roundRect(ctx, ebtn.x * d, ebtn.y * d, ebtn.w * d, ebtn.h * d, 8 * d)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = d
    this.roundRect(ctx, ebtn.x * d, ebtn.y * d, ebtn.w * d, ebtn.h * d, 8 * d)
    ctx.stroke()
    ctx.fillStyle = '#BDC3C7'
    ctx.font = (14 * d) + 'px sans-serif'
    ctx.fillText('微信授权获取头像昵称', (ebtn.x + ebtn.w / 2) * d, (ebtn.y + ebtn.h / 2) * d)
  }
}

GameMain.prototype.paintGame = function() {
  var ctx = this.ctx
  ctx.fillStyle = '#F5F5F5'
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  this.paintBoard()
  this.paintStatus()
  this.paintBtns()

  // 显示用户昵称（左上角）
  if (this.authed) {
    var ctx2 = this.ctx
    var d = this.dpr
    ctx2.fillStyle = '#666'
    ctx2.font = (12 * d) + 'px sans-serif'
    ctx2.textAlign = 'left'
    ctx2.textBaseline = 'top'
    ctx2.fillText('玩家: ' + this.nickName, 10 * d, 6 * d)
  }
}

GameMain.prototype.paintGuide = function() {
  var ctx = this.ctx
  var d = this.dpr
  var w = this.w * d
  var h = this.h * d

  // 半透明遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.75)'
  ctx.fillRect(0, 0, w, h)

  // 标题
  ctx.fillStyle = '#FFF'
  ctx.font = 'bold ' + (24 * d) + 'px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('游戏说明', w / 2, h * 0.2)

  // 提示列表
  var tips = [
    '黑子先行，五子连珠即可获胜',
    '点击下方按钮切换游戏模式',
    '支持悔棋功能'
  ]
  ctx.font = (16 * d) + 'px sans-serif'
  ctx.fillStyle = '#ECF0F1'
  for (var i = 0; i < tips.length; i++) {
    ctx.fillText('●  ' + tips[i], w / 2, h * 0.33 + i * 40 * d)
  }

  // 按钮
  var btn = this.guideBtn
  ctx.fillStyle = '#3498DB'
  this.roundRect(ctx, btn.x * d, btn.y * d, btn.w * d, btn.h * d, 8 * d)
  ctx.fill()
  ctx.fillStyle = '#FFF'
  ctx.font = 'bold ' + (16 * d) + 'px sans-serif'
  ctx.fillText('我知道了', (btn.x + btn.w / 2) * d, (btn.y + btn.h / 2) * d)
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

// ========== 圆角矩形 ==========

GameMain.prototype.roundRect = function(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ========== 触摸事件 ==========

GameMain.prototype.listen = function() {
  var self = this
  wx.onTouchStart(function(e) {
    var tx = e.touches[0].clientX
    var ty = e.touches[0].clientY

    if (self.page === 'welcome') {
      self.onWelcomeTap(tx, ty)
    } else if (self.page === 'guide') {
      self.onGuideTap(tx, ty)
    } else {
      self.onGameTap(tx, ty)
    }
  })
}

GameMain.prototype.onWelcomeTap = function(tx, ty) {
  var btn = this.welcomeBtn
  if (tx >= btn.x && tx < btn.x + btn.w && ty >= btn.y && ty < btn.y + btn.h) {
    // 点击"开始游戏"或"进入游戏"
    if (this.authed) {
      this.enterGame()
    } else {
      this.enterGame()
    }
    return
  }

  if (!this.authed) {
    var ebtn = this.enterBtn
    if (tx >= ebtn.x && tx < ebtn.x + ebtn.w && ty >= ebtn.y && ty < ebtn.y + ebtn.h) {
      this.doAuth()
    }
  }
}

GameMain.prototype.onGuideTap = function(tx, ty) {
  var btn = this.guideBtn
  if (tx >= btn.x && tx < btn.x + btn.w && ty >= btn.y && ty < btn.y + btn.h) {
    this.guideDismissed = true
    this.saveGuideState()
    this.page = 'playing'
    this.paint()
  }
}

GameMain.prototype.onGameTap = function(tx, ty) {
  if (this.thinking) return

  for (var i = 0; i < this.btns.length; i++) {
    var b = this.btns[i]
    if (tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h) {
      this.clickBtn(b)
      return
    }
  }

  if (this.board.gameOver) return

  var dx = tx - this.bx - PAD
  var dy = ty - this.by - PAD
  var col = Math.round(dx / CELL)
  var row = Math.round(dy / CELL)
  if (col < 0 || col >= SIZE || row < 0 || row >= SIZE) return

  if (this.board.placeStone(row, col)) {
    this.updateStatus()
    this.paint()
    if (!this.board.gameOver && this.mode !== GameMode.PVP) {
      this.doAI()
    }
  }
}

// ========== 授权 ==========

GameMain.prototype.doAuth = function() {
  var self = this
  wx.getUserProfile({
    desc: '用于显示用户昵称和头像',
    success: function(res) {
      var info = res.userInfo
      self.nickName = info.nickName || '玩家'
      self.authed = true

      // 加载头像
      if (info.avatarUrl) {
        var img = wx.createImage()
        img.onload = function() {
          self.avatarImg = img
          self.paint()
        }
        img.src = info.avatarUrl
      }
      self.paint()
    },
    fail: function() {
      // 用户拒绝授权，不影响使用
    }
  })
}

// ========== 页面流转 ==========

GameMain.prototype.enterGame = function() {
  if (this.guideDismissed) {
    this.page = 'playing'
  } else {
    this.page = 'guide'
  }
  this.paint()
}

// ========== 按钮操作 ==========

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
