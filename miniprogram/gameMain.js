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
  this.authBtn = null
  this.guideDismissed = false

  this.anim = null
  this.timer = 30
  this.timerId = null
  this.stats = { total: 0, win: 0, lose: 0 }
  this.loadStats()
  this.initAudio()
  this.loadGuideState()
}

GameMain.prototype.start = function() {
  this.initLayout()
  this.setupAuthButton()
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

GameMain.prototype.loadStats = function() {
  try {
    var s = wx.getStorageSync('game_stats')
    if (s) this.stats = JSON.parse(s)
  } catch (e) {}
}

GameMain.prototype.saveStats = function() {
  try {
    wx.setStorageSync('game_stats', JSON.stringify(this.stats))
  } catch (e) {}
}

GameMain.prototype.recordResult = function(winner) {
  this.stats.total++
  if (winner === BLACK) this.stats.win++
  else this.stats.lose++
  this.saveStats()
}

GameMain.prototype.initAudio = function() {
  try {
    this.placeSound = wx.createInnerAudioContext()
    this.placeSound.src = 'audio/place.wav'
    this.winSound = wx.createInnerAudioContext()
    this.winSound.src = 'audio/win.wav'
  } catch (e) {
    this.placeSound = null
    this.winSound = null
  }
}

GameMain.prototype.playSound = function(type) {
  try {
    if (type === 'place' && this.placeSound) {
      this.placeSound.stop()
      this.placeSound.play()
    } else if (type === 'win' && this.winSound) {
      this.winSound.stop()
      this.winSound.play()
    }
  } catch (e) {}
}

GameMain.prototype.startTimer = function() {
  var self = this
  self.stopTimer()
  self.timer = 30
  self.timerId = setInterval(function() {
    self.timer--
    self.paint()
    if (self.timer <= 0) {
      self.stopTimer()
      self.board.gameOver = true
      self.board.winner = self.board.currentPlayer === BLACK ? WHITE : BLACK
      self.status = '时间到！' + (self.board.winner === BLACK ? '黑子' : '白子') + '获胜！'
      self.recordResult(self.board.winner)
      self.paint()
    }
  }, 1000)
}

GameMain.prototype.stopTimer = function() {
  if (this.timerId) {
    clearInterval(this.timerId)
    this.timerId = null
  }
}

GameMain.prototype.animateStone = function(row, col, player) {
  var self = this
  this.anim = { row: row, col: col, player: player, progress: 0.2 }
  var steps = 6
  var step = 1
  var timer = setInterval(function() {
    step++
    self.anim.progress = Math.min(step / steps, 1)
    self.paint()
    if (step >= steps) {
      clearInterval(timer)
      self.anim = null
    }
  }, 16)
}

GameMain.prototype.initLayout = function() {
  var totalH = BOARD + 12 + 32 + 8 + 32 + 44
  var by = Math.floor((this.h - totalH) / 2)
  var bx = Math.floor((this.w - BOARD) / 2)
  this.bx = bx
  this.by = by

  var names = ['人人对战', '高级人机', '中级人机', '普通人机']
  var bw = 66
  var gap = 6
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

  this.btns.push({ x: 12, y: 30, w: 36, h: 30, text: '←', act: 'home' })

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
  ctx.fillText('神奇的五子棋', w / 2, h * 0.2)

  // 副标题
  ctx.fillStyle = '#95A5A6'
  ctx.font = (16 * d) + 'px sans-serif'
  ctx.fillText('经典策略对弈游戏', w / 2, h * 0.27)

  // 头像
  var avatarR = 40 * d
  var avatarY = h * 0.38
  if (this.avatarImg) {
    // 头像边框
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.arc(w / 2, avatarY, avatarR + 3 * d, 0, 6.3)
    ctx.fill()
    ctx.save()
    ctx.beginPath()
    ctx.arc(w / 2, avatarY, avatarR, 0, 6.3)
    ctx.clip()
    ctx.drawImage(this.avatarImg, w / 2 - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2)
    ctx.restore()
  } else {
    // 默认头像 - 棋子样式
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.arc(w / 2, avatarY, avatarR, 0, 6.3)
    ctx.fill()
    // 黑白棋子图标
    ctx.fillStyle = '#FFF'
    ctx.beginPath()
    ctx.arc(w / 2 - 12 * d, avatarY, 16 * d, 0, 6.3)
    ctx.fill()
    ctx.fillStyle = '#2C3E50'
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = d
    ctx.beginPath()
    ctx.arc(w / 2 - 12 * d, avatarY, 16 * d, 0, 6.3)
    ctx.stroke()
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(w / 2 + 12 * d, avatarY, 16 * d, 0, 6.3)
    ctx.fill()
  }

  // 昵称
  ctx.fillStyle = '#ECF0F1'
  ctx.font = (18 * d) + 'px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(this.nickName, w / 2, h * 0.47)

  // 开始/进入游戏按钮
  var btn = this.welcomeBtn
  ctx.fillStyle = '#E67E22'
  this.roundRect(ctx, btn.x * d, btn.y * d, btn.w * d, btn.h * d, 22 * d)
  ctx.fill()
  ctx.fillStyle = '#FFF'
  ctx.font = 'bold ' + (18 * d) + 'px sans-serif'
  ctx.fillText(this.authed ? '进入游戏' : '开始游戏', (btn.x + btn.w / 2) * d, (btn.y + btn.h / 2) * d)

  // 授权按钮（未授权时显示）
  if (!this.authed) {
    var ebtn = this.enterBtn
    ctx.fillStyle = '#27AE60'
    this.roundRect(ctx, ebtn.x * d, ebtn.y * d, ebtn.w * d, ebtn.h * d, 22 * d)
    ctx.fill()
    ctx.fillStyle = '#FFF'
    ctx.font = (14 * d) + 'px sans-serif'
    ctx.fillText('获取头像昵称', (ebtn.x + ebtn.w / 2) * d, (ebtn.y + ebtn.h / 2) * d)
  }
}

GameMain.prototype.paintGame = function() {
  var ctx = this.ctx
  ctx.fillStyle = '#F5F5F5'
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  this.paintBoard()
  this.paintStatus()
  this.paintBtns()

  // 显示统计信息（与返回按钮同一行）
  var ctx2 = this.ctx
  var d = this.dpr
  ctx2.fillStyle = '#999'
  ctx2.font = (11 * d) + 'px sans-serif'
  ctx2.textAlign = 'right'
  ctx2.textBaseline = 'middle'
  var s = this.stats
  ctx2.fillText('战绩 ' + s.total + '局 ' + s.win + '胜 ' + s.lose + '负', (this.w - 10) * d, 45 * d)

  // 游戏结束时显示分享按钮
  if (this.board.gameOver) {
    var sw = 80, sh = 30
    var sx = Math.floor((this.w - sw) / 2)
    var sy = this.statusY + 24
    this.shareBtn = { x: sx, y: sy, w: sw, h: sh }
    ctx2.fillStyle = '#27AE60'
    this.roundRect(ctx2, sx * d, sy * d, sw * d, sh * d, 6 * d)
    ctx2.fill()
    ctx2.fillStyle = '#FFF'
    ctx2.font = (13 * d) + 'px sans-serif'
    ctx2.textAlign = 'center'
    ctx2.textBaseline = 'middle'
    ctx2.fillText('分享战绩', (sx + sw / 2) * d, (sy + sh / 2) * d)
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

  var rad = cell * 0.38
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var v = this.board.getCell(r, c)
      if (v === EMPTY) continue
      var cx = ox + pad + c * cell
      var cy = oy + pad + r * cell

      var stoneRad = rad
      if (this.anim && this.anim.row === r && this.anim.col === c) {
        stoneRad = Math.max(rad * this.anim.progress, 1)
      }

      ctx.beginPath()
      ctx.arc(cx, cy, stoneRad, 0, 6.3)
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

  // 倒计时
  if (!this.board.gameOver && !this.thinking) {
    var color = this.timer <= 5 ? '#E74C3C' : '#999'
    ctx.fillStyle = color
    ctx.font = 'bold ' + (18 * d) + 'px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(this.timer + 's', (this.w - 10) * d, (this.statusY + 24) * d)
  }
}

GameMain.prototype.paintBtns = function() {
  var ctx = this.ctx
  var d = this.dpr
  var r = 8 * d
  for (var i = 0; i < this.btns.length; i++) {
    var b = this.btns[i]
    var bx = b.x * d, by = b.y * d, bw = b.w * d, bh = b.h * d

    // 背景
    if (b.act === 'mode') {
      ctx.fillStyle = (b.idx === this.modeIdx) ? '#E67E22' : '#FFF'
    } else if (b.act === 'undo') {
      ctx.fillStyle = '#F39C12'
    } else if (b.act === 'reset') {
      ctx.fillStyle = '#E74C3C'
    } else if (b.act === 'home') {
      ctx.fillStyle = '#ECF0F1'
    } else {
      ctx.fillStyle = '#FFF'
    }
    this.roundRect(ctx, bx, by, bw, bh, r)
    ctx.fill()

    // 边框
    ctx.strokeStyle = '#CCC'
    ctx.lineWidth = d
    this.roundRect(ctx, bx, by, bw, bh, r)
    ctx.stroke()

    // 文字颜色
    if (b.act === 'mode' && b.idx === this.modeIdx) {
      ctx.fillStyle = '#FFF'
    } else if (b.act === 'undo' || b.act === 'reset') {
      ctx.fillStyle = '#FFF'
    } else {
      ctx.fillStyle = '#333'
    }
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
    this.enterGame()
    return
  }

  // 兜底：原生按钮不存在时，点击画布按钮直接进入游戏
  if (!this.authBtn && !this.authed) {
    var ebtn = this.enterBtn
    if (tx >= ebtn.x && tx < ebtn.x + ebtn.w && ty >= ebtn.y && ty < ebtn.y + ebtn.h) {
      this.enterGame()
    }
  }
}

GameMain.prototype.onGuideTap = function(tx, ty) {
  var btn = this.guideBtn
  if (tx >= btn.x && tx < btn.x + btn.w && ty >= btn.y && ty < btn.y + btn.h) {
    this.guideDismissed = true
    this.saveGuideState()
    this.page = 'playing'
    this.startTimer()
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

  if (this.board.gameOver) {
    if (this.shareBtn) {
      var sb = this.shareBtn
      if (tx >= sb.x && tx < sb.x + sb.w && ty >= sb.y && ty < sb.y + sb.h) {
        this.doShare()
      }
    }
    return
  }

  var dx = tx - this.bx - PAD
  var dy = ty - this.by - PAD
  var col = Math.round(dx / CELL)
  var row = Math.round(dy / CELL)
  if (col < 0 || col >= SIZE || row < 0 || row >= SIZE) return

  if (this.board.placeStone(row, col)) {
    if (this.board.gameOver) {
      this.stopTimer()
      this.playSound('win')
      this.recordResult(this.board.winner)
    } else {
      this.playSound('place')
      this.animateStone(row, col, this.board.getCell(row, col))
      this.startTimer()
    }
    this.updateStatus()
    this.paint()
    if (!this.board.gameOver && this.mode !== GameMode.PVP) {
      this.doAI()
    }
  }
}

// ========== 授权 ==========

GameMain.prototype.setupAuthButton = function() {
  var self = this
  var ebtn = this.enterBtn

  try {
    var btn = wx.createUserInfoButton({
      type: 'text',
      text: ' ',
      style: {
        left: ebtn.x,
        top: ebtn.y,
        width: ebtn.w,
        height: ebtn.h,
        backgroundColor: 'rgba(0,0,0,0)',
        color: 'rgba(255,255,255,0)',
        fontSize: 1,
        borderRadius: 22
      }
    })

    btn.onTap(function(res) {
      btn.destroy()
      self.authBtn = null
      if (res.userInfo) {
        self.onAuthSuccess(res.userInfo)
      }
    })

    this.authBtn = btn
    if (this.authed) btn.hide()
  } catch (e) {}
}

GameMain.prototype.onAuthSuccess = function(info) {
  if (!info) return
  this.nickName = info.nickName || '玩家'
  this.authed = true
  if (info.avatarUrl) {
    var self = this
    var img = wx.createImage()
    img.onload = function() {
      self.avatarImg = img
      self.paint()
    }
    img.src = info.avatarUrl
  }
  this.paint()
}

// ========== 页面流转 ==========

GameMain.prototype.enterGame = function() {
  if (this.authBtn) { this.authBtn.hide() }
  if (this.guideDismissed) {
    this.page = 'playing'
    this.startTimer()
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
    this.startTimer()
    this.updateStatus()
    this.paint()
  } else if (b.act === 'reset') {
    this.resetGame()
  } else if (b.act === 'home') {
    this.board.reset()
    this.thinking = false
    this.stopTimer()
    this.status = '当前回合：黑子'
    this.guideDismissed = false
    this.page = 'welcome'
    if (!this.authed && this.authBtn) { this.authBtn.show() }
    this.paint()
  }
}

GameMain.prototype.resetGame = function() {
  this.board.reset()
  this.thinking = false
  this.startTimer()
  this.updateStatus()
  this.paint()
}

GameMain.prototype.doAI = function() {
  var self = this
  self.thinking = true
  self.stopTimer()
  self.paint()
  var snap = self.board.getBoardCopy()
  var gai = new GomokuAI(self.mode.depth, self.mode.range, self.mode.maxCandidates, self.mode.randomPick)
  setTimeout(function() {
    var mv = gai.findBestMove(snap)
    if (mv && !self.board.gameOver) {
      self.board.placeStone(mv.row, mv.col)
      if (self.board.gameOver) {
        self.stopTimer()
        self.playSound('win')
        self.recordResult(self.board.winner)
      } else {
        self.playSound('place')
        self.animateStone(mv.row, mv.col, self.board.getCell(mv.row, mv.col))
        self.startTimer()
      }
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

GameMain.prototype.doShare = function() {
  var s = this.stats
  var title = '我在《神奇的五子棋》打了' + s.total + '局，赢了' + s.win + '局！来挑战我吧！'
  try {
    wx.shareAppMessage({ title: title })
  } catch (e) {}
}

module.exports = { GameMain: GameMain }
