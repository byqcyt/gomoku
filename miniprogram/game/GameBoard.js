export const SIZE = 15
export const EMPTY = 0
export const BLACK = 1
export const WHITE = 2

function createBoard() {
  const board = []
  for (let i = 0; i < SIZE; i++) {
    board[i] = []
    for (let j = 0; j < SIZE; j++) {
      board[i][j] = EMPTY
    }
  }
  return board
}

export class GameBoard {
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
    this.board = createBoard()
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
    this.moveHistory.push({ row: row, col: col, player: this.currentPlayer })
    if (this.checkWin(row, col)) {
      this.winner = this.currentPlayer
      this.gameOver = true
    } else {
      this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK
    }
    return true
  }

  checkWin(row, col) {
    var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
    var player = this.board[row][col]
    for (var d = 0; d < dirs.length; d++) {
      var dr = dirs[d][0], dc = dirs[d][1]
      var count = 1
      var sr = row, sc = col, er = row, ec = col
      for (var i = 1; i < 5; i++) {
        var r = row + dr * i, c = col + dc * i
        if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && this.board[r][c] === player) {
          count++; er = r; ec = c
        } else break
      }
      for (var i = 1; i < 5; i++) {
        var r = row - dr * i, c = col - dc * i
        if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && this.board[r][c] === player) {
          count++; sr = r; sc = c
        } else break
      }
      if (count >= 5) {
        this.winLine = { sr: sr, sc: sc, er: er, ec: ec }
        return true
      }
    }
    return false
  }

  undoLastMove() {
    if (this.moveHistory.length === 0) return false
    var last = this.moveHistory.pop()
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
    var copy = []
    for (var i = 0; i < SIZE; i++) {
      copy[i] = []
      for (var j = 0; j < SIZE; j++) {
        copy[i][j] = this.board[i][j]
      }
    }
    return copy
  }
}
