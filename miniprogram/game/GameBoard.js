var SIZE = 15
var EMPTY = 0
var BLACK = 1
var WHITE = 2

function createBoard() {
  var board = []
  for (var i = 0; i < SIZE; i++) {
    board[i] = []
    for (var j = 0; j < SIZE; j++) {
      board[i][j] = EMPTY
    }
  }
  return board
}

function GameBoard() {
  this.board = []
  this.currentPlayer = BLACK
  this.gameOver = false
  this.winner = EMPTY
  this.winLine = null
  this.moveHistory = []
  this.reset()
}

GameBoard.prototype.reset = function() {
  this.board = createBoard()
  this.currentPlayer = BLACK
  this.gameOver = false
  this.winner = EMPTY
  this.winLine = null
  this.moveHistory = []
}

GameBoard.prototype.placeStone = function(row, col) {
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

GameBoard.prototype.checkWin = function(row, col) {
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

GameBoard.prototype.undoLastMove = function() {
  if (this.moveHistory.length === 0) return false
  var last = this.moveHistory.pop()
  this.board[last.row][last.col] = EMPTY
  this.currentPlayer = last.player
  this.gameOver = false
  this.winner = EMPTY
  this.winLine = null
  return true
}

GameBoard.prototype.getCell = function(row, col) {
  return this.board[row][col]
}

GameBoard.prototype.getBoardCopy = function() {
  var copy = []
  for (var i = 0; i < SIZE; i++) {
    copy[i] = []
    for (var j = 0; j < SIZE; j++) {
      copy[i][j] = this.board[i][j]
    }
  }
  return copy
}

module.exports = { GameBoard: GameBoard, SIZE: SIZE, EMPTY: EMPTY, BLACK: BLACK, WHITE: WHITE }
