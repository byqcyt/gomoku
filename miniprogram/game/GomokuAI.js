var gb = require('./GameBoard.js')
var SIZE = gb.SIZE
var EMPTY = gb.EMPTY
var BLACK = gb.BLACK
var WHITE = gb.WHITE

var SCORE_FIVE = 1000000
var SCORE_LIVE_FOUR = 50000
var SCORE_RUSH_FOUR = 5000
var SCORE_LIVE_THREE = 5000
var SCORE_SLEEP_THREE = 500
var SCORE_LIVE_TWO = 500
var SCORE_SLEEP_TWO = 50

function GomokuAI(depth, candidateRange, maxCandidates, randomPick) {
  this.depth = depth
  this.candidateRange = candidateRange
  this.maxCandidates = maxCandidates
  this.randomPick = randomPick
}

GomokuAI.prototype.findBestMove = function(board) {
  var local = this.copyBoard(board)
  var candidates = this.getCandidates(local)
  if (candidates.length === 0) return { row: 7, col: 7 }

  if (this.maxCandidates > 0 && candidates.length > this.maxCandidates) {
    candidates = this.selectTopCandidates(local, candidates, this.maxCandidates)
  }

  var scored = []
  for (var i = 0; i < candidates.length; i++) {
    var move = candidates[i]
    local[move.row][move.col] = WHITE
    var score = this.minimax(local, this.depth - 1, -999999999, 999999999, false, 15)
    local[move.row][move.col] = EMPTY
    scored.push({ move: move, score: score })
  }

  scored.sort(function(a, b) { return b.score - a.score })

  if (this.randomPick && scored.length > 1) {
    var top = Math.min(3, scored.length)
    return scored[Math.floor(Math.random() * top)].move
  }
  return scored[0].move
}

GomokuAI.prototype.selectTopCandidates = function(board, candidates, topN) {
  var scored = []
  for (var i = 0; i < candidates.length; i++) {
    var move = candidates[i]
    board[move.row][move.col] = WHITE
    var score = this.quickScore(board, move.row, move.col)
    board[move.row][move.col] = EMPTY
    scored.push({ move: move, score: score, defense: 0 })
  }

  for (var i = 0; i < candidates.length; i++) {
    var move = candidates[i]
    if (board[move.row][move.col] !== EMPTY) continue
    board[move.row][move.col] = BLACK
    var threat = this.quickScore(board, move.row, move.col)
    board[move.row][move.col] = EMPTY
    for (var j = 0; j < scored.length; j++) {
      if (scored[j].move.row === move.row && scored[j].move.col === move.col) {
        scored[j].defense = threat
        break
      }
    }
  }

  scored.sort(function(a, b) { return (b.score + b.defense) - (a.score + a.defense) })
  var result = []
  for (var i = 0; i < Math.min(topN, scored.length); i++) {
    result.push(scored[i].move)
  }
  return result
}

GomokuAI.prototype.quickScore = function(board, row, col) {
  var score = 0
  var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (var d = 0; d < dirs.length; d++) {
    var count = this.countLine(board, row, col, dirs[d][0], dirs[d][1])
    var open = this.countOpenEnds(board, row, col, dirs[d][0], dirs[d][1])
    score += this.patternScore(count, open)
  }
  return score
}

GomokuAI.prototype.countLine = function(board, row, col, dr, dc) {
  var player = board[row][col]
  var count = 1
  for (var i = 1; i < 5; i++) {
    var r = row + dr * i, c = col + dc * i
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) count++
    else break
  }
  for (var i = 1; i < 5; i++) {
    var r = row - dr * i, c = col - dc * i
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) count++
    else break
  }
  return count
}

GomokuAI.prototype.countOpenEnds = function(board, row, col, dr, dc) {
  var player = board[row][col]
  var open = 0
  var r = row + dr, c = col + dc
  while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) { r += dr; c += dc }
  if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === EMPTY) open++
  r = row - dr; c = col - dc
  while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) { r -= dr; c -= dc }
  if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === EMPTY) open++
  return open
}

GomokuAI.prototype.minimax = function(board, depth, alpha, beta, maximizing, limit) {
  if (depth === 0) return this.evaluateBoard(board)
  var candidates = this.getCandidates(board)
  if (candidates.length === 0) return this.evaluateBoard(board)
  if (candidates.length > limit) candidates = this.selectTopCandidates(board, candidates, limit)

  if (maximizing) {
    var maxEval = -999999999
    for (var i = 0; i < candidates.length; i++) {
      board[candidates[i].row][candidates[i].col] = WHITE
      var eval_ = this.minimax(board, depth - 1, alpha, beta, false, limit)
      board[candidates[i].row][candidates[i].col] = EMPTY
      if (eval_ > maxEval) maxEval = eval_
      if (eval_ > alpha) alpha = eval_
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    var minEval = 999999999
    for (var i = 0; i < candidates.length; i++) {
      board[candidates[i].row][candidates[i].col] = BLACK
      var eval_ = this.minimax(board, depth - 1, alpha, beta, true, limit)
      board[candidates[i].row][candidates[i].col] = EMPTY
      if (eval_ < minEval) minEval = eval_
      if (eval_ < beta) beta = eval_
      if (beta <= alpha) break
    }
    return minEval
  }
}

GomokuAI.prototype.getCandidates = function(board) {
  var near = []
  for (var i = 0; i < SIZE; i++) {
    near[i] = []
    for (var j = 0; j < SIZE; j++) near[i][j] = false
  }
  var hasStones = false
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) {
        hasStones = true
        for (var dr = -this.candidateRange; dr <= this.candidateRange; dr++) {
          for (var dc = -this.candidateRange; dc <= this.candidateRange; dc++) {
            var nr = r + dr, nc = c + dc
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === EMPTY) {
              near[nr][nc] = true
            }
          }
        }
      }
    }
  }
  if (!hasStones) return [{ row: 7, col: 7 }]
  var result = []
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (near[r][c]) result.push({ row: r, col: c })
    }
  }
  return result
}

GomokuAI.prototype.evaluateBoard = function(board) {
  var aiScore = 0, humanScore = 0
  for (var r = 0; r < SIZE; r++) {
    var scores = this.scoreLine(board[r])
    aiScore += scores[0]; humanScore += scores[1]
  }
  for (var c = 0; c < SIZE; c++) {
    var line = []
    for (var r = 0; r < SIZE; r++) line.push(board[r][c])
    var scores = this.scoreLine(line)
    aiScore += scores[0]; humanScore += scores[1]
  }
  for (var start = -SIZE + 1; start < SIZE; start++) {
    var line = []
    for (var r = 0; r < SIZE; r++) { var c = r - start; if (c >= 0 && c < SIZE) line.push(board[r][c]) }
    if (line.length >= 2) { var scores = this.scoreLine(line); aiScore += scores[0]; humanScore += scores[1] }
  }
  for (var start = 0; start < 2 * SIZE - 1; start++) {
    var line = []
    for (var r = 0; r < SIZE; r++) { var c = start - r; if (c >= 0 && c < SIZE) line.push(board[r][c]) }
    if (line.length >= 2) { var scores = this.scoreLine(line); aiScore += scores[0]; humanScore += scores[1] }
  }
  return aiScore - humanScore
}

GomokuAI.prototype.scoreLine = function(line) {
  var aiScore = 0, humanScore = 0
  var i = 0
  while (i < line.length) {
    if (line[i] === EMPTY) { i++; continue }
    var player = line[i]
    var count = 1, j = i + 1
    while (j < line.length && line[j] === player) { count++; j++ }
    var openEnds = 0
    if (i > 0 && line[i - 1] === EMPTY) openEnds++
    if (j < line.length && line[j] === EMPTY) openEnds++
    var score = this.patternScore(count, openEnds)
    if (player === WHITE) aiScore += score; else humanScore += score
    i = j
  }
  return [aiScore, humanScore]
}

GomokuAI.prototype.patternScore = function(count, openEnds) {
  if (count >= 5) return SCORE_FIVE
  if (openEnds === 0) return 0
  if (count === 4) return openEnds === 2 ? SCORE_LIVE_FOUR : SCORE_RUSH_FOUR
  if (count === 3) return openEnds === 2 ? SCORE_LIVE_THREE : SCORE_SLEEP_THREE
  if (count === 2) return openEnds === 2 ? SCORE_LIVE_TWO : SCORE_SLEEP_TWO
  return 0
}

GomokuAI.prototype.copyBoard = function(board) {
  var copy = []
  for (var i = 0; i < SIZE; i++) {
    copy[i] = []
    for (var j = 0; j < SIZE; j++) {
      copy[i][j] = board[i][j]
    }
  }
  return copy
}

module.exports = { GomokuAI: GomokuAI }
