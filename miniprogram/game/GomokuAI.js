import { SIZE, EMPTY, BLACK, WHITE } from './GameBoard.js'

const SCORE_FIVE = 1000000
const SCORE_LIVE_FOUR = 50000
const SCORE_RUSH_FOUR = 5000
const SCORE_LIVE_THREE = 5000
const SCORE_SLEEP_THREE = 500
const SCORE_LIVE_TWO = 500
const SCORE_SLEEP_TWO = 50

export class GomokuAI {
  constructor(depth, candidateRange, maxCandidates, randomPick) {
    this.depth = depth
    this.candidateRange = candidateRange
    this.maxCandidates = maxCandidates
    this.randomPick = randomPick
  }

  findBestMove(board) {
    const local = board.map(r => [...r])
    let candidates = this.getCandidates(local)
    if (candidates.length === 0) return { row: 7, col: 7 }

    if (this.maxCandidates > 0 && candidates.length > this.maxCandidates) {
      candidates = this.selectTopCandidates(local, candidates, this.maxCandidates)
    }

    const scored = []
    for (const move of candidates) {
      local[move.row][move.col] = WHITE
      const score = this.minimax(local, this.depth - 1, -Infinity, Infinity, false, 15)
      local[move.row][move.col] = EMPTY
      scored.push({ move, score })
    }

    scored.sort((a, b) => b.score - a.score)

    if (this.randomPick && scored.length > 1) {
      const top = Math.min(3, scored.length)
      return scored[Math.floor(Math.random() * top)].move
    }
    return scored[0].move
  }

  selectTopCandidates(board, candidates, topN) {
    const scored = candidates.map(move => {
      board[move.row][move.col] = WHITE
      const score = this.quickScore(board, move.row, move.col)
      board[move.row][move.col] = EMPTY
      return { move, score, defense: 0 }
    })

    for (const move of candidates) {
      if (board[move.row][move.col] !== EMPTY) continue
      board[move.row][move.col] = BLACK
      const threat = this.quickScore(board, move.row, move.col)
      board[move.row][move.col] = EMPTY
      const item = scored.find(s => s.move.row === move.row && s.move.col === move.col)
      if (item) item.defense = threat
    }

    scored.sort((a, b) => (b.score + b.defense) - (a.score + a.defense))
    return scored.slice(0, topN).map(s => s.move)
  }

  quickScore(board, row, col) {
    let score = 0
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
    for (const [dr, dc] of dirs) {
      const count = this.countLine(board, row, col, dr, dc)
      const open = this.countOpenEnds(board, row, col, dr, dc)
      score += this.patternScore(count, open)
    }
    return score
  }

  countLine(board, row, col, dr, dc) {
    const player = board[row][col]
    let count = 1
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i, c = col + dc * i
      if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) count++
      else break
    }
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i, c = col - dc * i
      if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) count++
      else break
    }
    return count
  }

  countOpenEnds(board, row, col, dr, dc) {
    const player = board[row][col]
    let open = 0
    let r = row + dr, c = col + dc
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) { r += dr; c += dc }
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === EMPTY) open++
    r = row - dr; c = col - dc
    while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) { r -= dr; c -= dc }
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === EMPTY) open++
    return open
  }

  minimax(board, depth, alpha, beta, maximizing, limit) {
    if (depth === 0) return this.evaluateBoard(board)
    let candidates = this.getCandidates(board)
    if (candidates.length === 0) return this.evaluateBoard(board)
    if (candidates.length > limit) candidates = this.selectTopCandidates(board, candidates, limit)

    if (maximizing) {
      let maxEval = -Infinity
      for (const move of candidates) {
        board[move.row][move.col] = WHITE
        const eval_ = this.minimax(board, depth - 1, alpha, beta, false, limit)
        board[move.row][move.col] = EMPTY
        maxEval = Math.max(maxEval, eval_)
        alpha = Math.max(alpha, eval_)
        if (beta <= alpha) break
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (const move of candidates) {
        board[move.row][move.col] = BLACK
        const eval_ = this.minimax(board, depth - 1, alpha, beta, true, limit)
        board[move.row][move.col] = EMPTY
        minEval = Math.min(minEval, eval_)
        beta = Math.min(beta, eval_)
        if (beta <= alpha) break
      }
      return minEval
    }
  }

  getCandidates(board) {
    const near = Array.from({ length: SIZE }, () => Array(SIZE).fill(false))
    let hasStones = false
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] !== EMPTY) {
          hasStones = true
          for (let dr = -this.candidateRange; dr <= this.candidateRange; dr++) {
            for (let dc = -this.candidateRange; dc <= this.candidateRange; dc++) {
              const nr = r + dr, nc = c + dc
              if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === EMPTY) {
                near[nr][nc] = true
              }
            }
          }
        }
      }
    }
    if (!hasStones) return [{ row: 7, col: 7 }]
    const result = []
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (near[r][c]) result.push({ row: r, col: c })
      }
    }
    return result
  }

  evaluateBoard(board) {
    let aiScore = 0, humanScore = 0
    for (let r = 0; r < SIZE; r++) {
      const line = board[r]
      const [a, h] = this.scoreLine(line)
      aiScore += a; humanScore += h
    }
    for (let c = 0; c < SIZE; c++) {
      const line = Array.from({ length: SIZE }, (_, r) => board[r][c])
      const [a, h] = this.scoreLine(line)
      aiScore += a; humanScore += h
    }
    for (let start = -SIZE + 1; start < SIZE; start++) {
      const line = []
      for (let r = 0; r < SIZE; r++) { const c = r - start; if (c >= 0 && c < SIZE) line.push(board[r][c]) }
      if (line.length >= 2) { const [a, h] = this.scoreLine(line); aiScore += a; humanScore += h }
    }
    for (let start = 0; start < 2 * SIZE - 1; start++) {
      const line = []
      for (let r = 0; r < SIZE; r++) { const c = start - r; if (c >= 0 && c < SIZE) line.push(board[r][c]) }
      if (line.length >= 2) { const [a, h] = this.scoreLine(line); aiScore += a; humanScore += h }
    }
    return aiScore - humanScore
  }

  scoreLine(line) {
    let aiScore = 0, humanScore = 0
    let i = 0
    while (i < line.length) {
      if (line[i] === EMPTY) { i++; continue }
      const player = line[i]
      let count = 1, j = i + 1
      while (j < line.length && line[j] === player) { count++; j++ }
      let openEnds = 0
      if (i > 0 && line[i - 1] === EMPTY) openEnds++
      if (j < line.length && line[j] === EMPTY) openEnds++
      const score = this.patternScore(count, openEnds)
      if (player === WHITE) aiScore += score; else humanScore += score
      i = j
    }
    return [aiScore, humanScore]
  }

  patternScore(count, openEnds) {
    if (count >= 5) return SCORE_FIVE
    if (openEnds === 0) return 0
    if (count === 4) return openEnds === 2 ? SCORE_LIVE_FOUR : SCORE_RUSH_FOUR
    if (count === 3) return openEnds === 2 ? SCORE_LIVE_THREE : SCORE_SLEEP_THREE
    if (count === 2) return openEnds === 2 ? SCORE_LIVE_TWO : SCORE_SLEEP_TWO
    return 0
  }
}
