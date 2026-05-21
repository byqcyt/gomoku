import { GameBoard, SIZE, EMPTY, BLACK, WHITE } from '../../game/GameBoard.js'
import { GameMode } from '../../game/GameMode.js'
import { GomokuAI } from '../../game/GomokuAI.js'

const CELL_SIZE = 22
const PADDING = 15

Page({
  data: {
    statusText: '当前回合：黑子',
    modeIndex: 0,
    modeNames: ['人人对战', '高级人机', '中级人机', '普通人机'],
    aiThinking: false
  },

  onLoad() {
    this.gameBoard = new GameBoard()
    this.currentMode = GameMode.PVP
    this.canvasReady = false
  },

  onReady() {
    const query = wx.createSelectorQuery()
    query.select('#boardCanvas').fields({ node: true, size: true }).exec(res => {
      const canvas = res[0].node
      this.canvas = canvas
      const dpr = wx.getSystemInfoSync().pixelRatio
      const size = PADDING * 2 + CELL_SIZE * (SIZE - 1)
      canvas.width = size * dpr
      canvas.height = size * dpr
      this.ctx = canvas.getContext('2d')
      this.ctx.scale(dpr, dpr)
      this.canvasReady = true
      this.drawBoard()
    })
  },

  drawBoard() {
    if (!this.canvasReady) return
    const ctx = this.ctx
    const size = PADDING * 2 + CELL_SIZE * (SIZE - 1)

    // 背景
    ctx.fillStyle = '#DEB887'
    ctx.fillRect(0, 0, size, size)

    // 网格线
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (let i = 0; i < SIZE; i++) {
      const pos = PADDING + i * CELL_SIZE
      ctx.beginPath(); ctx.moveTo(PADDING, pos); ctx.lineTo(size - PADDING, pos); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(pos, PADDING); ctx.lineTo(pos, size - PADDING); ctx.stroke()
    }

    // 星位
    const stars = [[3,3],[3,11],[7,7],[11,3],[11,11]]
    ctx.fillStyle = '#333'
    for (const [r, c] of stars) {
      ctx.beginPath()
      ctx.arc(PADDING + c * CELL_SIZE, PADDING + r * CELL_SIZE, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // 棋子
    const radius = CELL_SIZE * 0.42
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = this.gameBoard.getCell(r, c)
        if (cell === EMPTY) continue
        const x = PADDING + c * CELL_SIZE
        const y = PADDING + r * CELL_SIZE
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = cell === BLACK ? '#000' : '#FFF'
        ctx.fill()
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // 胜利连线
    if (this.gameBoard.winLine) {
      const { sr, sc, er, ec } = this.gameBoard.winLine
      ctx.strokeStyle = 'red'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(PADDING + sc * CELL_SIZE, PADDING + sr * CELL_SIZE)
      ctx.lineTo(PADDING + ec * CELL_SIZE, PADDING + er * CELL_SIZE)
      ctx.stroke()
    }
  },

  onTap(e) {
    if (this.gameBoard.gameOver || this.data.aiThinking) return
    const touch = e.touches[0]
    const query = wx.createSelectorQuery()
    query.select('#boardCanvas').boundingClientRect().exec(res => {
      const rect = res[0]
      const x = touch.x - rect.left
      const y = touch.y - rect.top
      const col = Math.round((x - PADDING) / CELL_SIZE)
      const row = Math.round((y - PADDING) / CELL_SIZE)

      if (this.gameBoard.placeStone(row, col)) {
        this.drawBoard()
        this.updateStatus()
        if (this.currentMode !== GameMode.PVP && !this.gameBoard.gameOver) {
          this.triggerAI()
        }
      }
    })
  },

  triggerAI() {
    this.setData({ aiThinking: true, statusText: 'AI正在思考...' })
    const snapshot = this.gameBoard.getBoardCopy()
    const ai = new GomokuAI(
      this.currentMode.depth,
      this.currentMode.range,
      this.currentMode.maxCandidates,
      this.currentMode.randomPick
    )
    setTimeout(() => {
      const move = ai.findBestMove(snapshot)
      if (move && !this.gameBoard.gameOver) {
        this.gameBoard.placeStone(move.row, move.col)
        this.drawBoard()
        this.updateStatus()
      }
      this.setData({ aiThinking: false })
    }, 100)
  },

  onModeChange(e) {
    const index = e.detail.value
    const modes = [GameMode.PVP, GameMode.PVE_HARD, GameMode.PVE_MEDIUM, GameMode.PVE_EASY]
    this.currentMode = modes[index]
    this.setData({ modeIndex: index })
    this.resetGame()
  },

  onUndo() {
    if (this.data.aiThinking) return
    if (this.currentMode !== GameMode.PVP) {
      this.gameBoard.undoLastMove()
      this.gameBoard.undoLastMove()
    } else {
      this.gameBoard.undoLastMove()
    }
    this.drawBoard()
    this.updateStatus()
  },

  onReset() {
    this.resetGame()
  },

  resetGame() {
    this.gameBoard.reset()
    this.setData({ aiThinking: false })
    this.drawBoard()
    this.updateStatus()
  },

  updateStatus() {
    if (this.gameBoard.gameOver) {
      const winner = this.gameBoard.winner === BLACK ? '黑子' : '白子'
      this.setData({ statusText: '游戏结束！' + winner + '获胜！' })
    } else {
      const player = this.gameBoard.currentPlayer === BLACK ? '黑子' : '白子'
      this.setData({ statusText: '当前回合：' + player })
    }
  }
})
