const SIZE = 15
const EMPTY = 0
const BLACK = 1
const WHITE = 2

class GameBoard {
  constructor() {
    this.board = []
    this.currentPlayer = BLACK
    this.gameOver = false
    this.winner = EMPTY
    this.winLine = null
    this.moveHistory = []
    this.reset()
  }

  reset() {
    this.board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY))
    this.currentPlayer = BLACK
    this.gameOver = false
    this.winner = EMPTY
    this.winLine = null
    this.moveHistory = []
  }

  placeStone(row, col) {
    if (this.gameOver || row < 0 || row >= SIZE || col < 0 || col >= SIZE) return false
    if (this.board[row][col] !== EMPTY) return false
    this.board[row][col] = this.currentPlayer
    this.moveHistory.push({ row, col, player: this.currentPlayer })
    if (this.checkWin(row, col)) {
      this.winner = this.currentPlayer
      this.gameOver = true
    } else {
      this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK
    }
    return true
  }

  checkWin(row, col) {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
    const player = this.board[row][col]
    for (const [dr, dc] of dirs) {
      let count = 1
      let sr = row, sc = col, er = row, ec = col
      for (let i = 1; i < 5; i++) {
        const r = row + dr * i, c = col + dc * i
        if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && this.board[r][c] === player) {
          count++; er = r; ec = c
        } else break
      }
      for (let i = 1; i < 5; i++) {
        const r = row - dr * i, c = col - dc * i
        if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && this.board[r][c] === player) {
          count++; sr = r; sc = c
        } else break
      }
      if (count >= 5) {
        this.winLine = { sr, sc, er, ec }
        return true
      }
    }
    return false
  }

  undoLastMove() {
    if (this.moveHistory.length === 0) return false
    const last = this.moveHistory.pop()
    this.board[last.row][last.col] = EMPTY
    this.currentPlayer = last.player
    this.gameOver = false
    this.winner = EMPTY
    this.winLine = null
    return true
  }

  getCell(row, col) {
    return this.board[row][col]
  }

  getBoardCopy() {
    return this.board.map(row => [...row])
  }
}

module.exports = { GameBoard, SIZE, EMPTY, BLACK, WHITE }
