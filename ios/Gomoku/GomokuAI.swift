import Foundation

class GomokuAI {
    // Scoring constants
    static let FIVE: Int = 1_000_000
    static let LIVE_FOUR: Int = 50_000
    static let RUSH_FOUR: Int = 5_000
    static let LIVE_THREE: Int = 5_000
    static let SLEEP_THREE: Int = 500
    static let LIVE_TWO: Int = 500
    static let SLEEP_TWO: Int = 50

    let depth: Int
    let candidateRange: Int
    let maxCandidates: Int
    let randomPick: Bool

    init(depth: Int = 4, candidateRange: Int = 1, maxCandidates: Int = 10, randomPick: Bool = false) {
        self.depth = depth
        self.candidateRange = candidateRange
        self.maxCandidates = maxCandidates
        self.randomPick = randomPick
    }

    func findBestMove(board: [[Int]], aiPlayer: Int = GameBoard.black) -> (row: Int, col: Int)? {
        let candidates = getCandidates(board: board)
        guard !candidates.isEmpty else { return nil }

        var bestScore = Int.min
        var bestMoves: [(row: Int, col: Int)] = []
        let maximizingPlayer = aiPlayer

        let currentPlayer = getCurrentPlayer(board: board)

        for move in candidates {
            var newBoard = board.map { $0 }
            newBoard[move.row][move.col] = currentPlayer
            let score = minimax(board: newBoard, depth: depth - 1, alpha: Int.min, beta: Int.max,
                               maximizingPlayer: maximizingPlayer, isAITurn: false)

            if score > bestScore {
                bestScore = score
                bestMoves = [move]
            } else if score == bestScore {
                bestMoves.append(move)
            }
        }

        if randomPick && bestMoves.count > 1 {
            return bestMoves.randomElement()
        }
        return bestMoves.first
    }

    func getCandidates(board: [[Int]]) -> [(row: Int, col: Int)] {
        let hasMoves = board.contains { row in row.contains { $0 != GameBoard.empty } }
        if !hasMoves {
            return [(row: GameBoard.size / 2, col: GameBoard.size / 2)]
        }

        return selectTopCandidates(board: board)
    }

    // MARK: - Candidate Selection

    func selectTopCandidates(board: [[Int]]) -> [(row: Int, col: Int)] {
        let size = GameBoard.size
        var scored: [(row: Int, col: Int, score: Int)] = []

        // Check if board is empty or nearly empty for center placement
        var hasPieces = false
        for r in 0..<size {
            for c in 0..<size {
                if board[r][c] != GameBoard.empty {
                    hasPieces = true
                    break
                }
            }
            if hasPieces { break }
        }

        if !hasPieces {
            return [(row: size / 2, col: size / 2)]
        }

        // Build occupied set for neighbor checking
        var occupied = [(Int, Int)]()
        for r in 0..<size {
            for c in 0..<size {
                if board[r][c] != GameBoard.empty {
                    occupied.append((r, c))
                }
            }
        }

        // For each empty cell near occupied cells, compute a quick heuristic score
        var visited = Set<Int>()
        for (r, c) in occupied {
            for dr in -candidateRange...candidateRange {
                for dc in -candidateRange...candidateRange {
                    let nr = r + dr
                    let nc = c + dc
                    guard nr >= 0, nr < size, nc >= 0, nc < size else { continue }
                    guard board[nr][nc] == GameBoard.empty else { continue }
                    let key = nr * size + nc
                    guard !visited.contains(key) else { continue }
                    visited.insert(key)

                    let score = quickHeuristic(board: board, row: nr, col: nc)
                    scored.append((row: nr, col: nc, score: score))
                }
            }
        }

        scored.sort { $0.score > $1.score }
        let count = min(maxCandidates, scored.count)
        return Array(scored.prefix(count)).map { (row: $0.row, col: $0.col) }
    }

    func quickHeuristic(board: [[Int]], row: Int, col: Int) -> Int {
        var score = 0
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        let size = GameBoard.size

        for (dr, dc) in directions {
            for player in [GameBoard.black, GameBoard.white] {
                var count = 0
                var blocked = 0

                // Forward
                for i in 1...4 {
                    let r = row + dr * i
                    let c = col + dc * i
                    guard r >= 0, r < size, c >= 0, c < size else { blocked += 1; break }
                    if board[r][c] == player {
                        count += 1
                    } else if board[r][c] != GameBoard.empty {
                        blocked += 1; break
                    } else { break }
                }

                // Backward
                for i in 1...4 {
                    let r = row - dr * i
                    let c = col - dc * i
                    guard r >= 0, r < size, c >= 0, c < size else { blocked += 1; break }
                    if board[r][c] == player {
                        count += 1
                    } else if board[r][c] != GameBoard.empty {
                        blocked += 1; break
                    } else { break }
                }

                let patternScore = patternScore(count: count, blocked: blocked)
                if player == GameBoard.black {
                    score += patternScore
                } else {
                    score += patternScore / 2
                }
            }
        }

        return score
    }

    // MARK: - Minimax with Alpha-Beta

    private func minimax(board: [[Int]], depth: Int, alpha: Int, beta: Int,
                         maximizingPlayer: Int, isAITurn: Bool) -> Int {
        if depth == 0 {
            return evaluateBoard(board: board, aiPlayer: maximizingPlayer)
        }

        let candidates = getCandidates(board: board)
        if candidates.isEmpty {
            return evaluateBoard(board: board, aiPlayer: maximizingPlayer)
        }

        let currentPlayer = getCurrentPlayer(board: board)

        if isAITurn {
            var value = Int.min
            var a = alpha
            for move in candidates {
                var newBoard = board.map { $0 }
                newBoard[move.row][move.col] = currentPlayer
                if checkWinOnBoard(newBoard, row: move.row, col: move.col, player: currentPlayer) {
                    return GomokuAI.FIVE * 10
                }
                value = max(value, minimax(board: newBoard, depth: depth - 1,
                                          alpha: a, beta: beta,
                                          maximizingPlayer: maximizingPlayer, isAITurn: false))
                a = max(a, value)
                if a >= beta { break }
            }
            return value
        } else {
            var value = Int.max
            var b = beta
            for move in candidates {
                var newBoard = board.map { $0 }
                newBoard[move.row][move.col] = currentPlayer
                if checkWinOnBoard(newBoard, row: move.row, col: move.col, player: currentPlayer) {
                    return -GomokuAI.FIVE * 10
                }
                value = min(value, minimax(board: newBoard, depth: depth - 1,
                                          alpha: alpha, beta: b,
                                          maximizingPlayer: maximizingPlayer, isAITurn: true))
                b = min(b, value)
                if alpha >= b { break }
            }
            return value
        }
    }

    private func getCurrentPlayer(board: [[Int]]) -> Int {
        var blackCount = 0
        var whiteCount = 0
        for row in board {
            for cell in row {
                if cell == GameBoard.black { blackCount += 1 }
                else if cell == GameBoard.white { whiteCount += 1 }
            }
        }
        return blackCount <= whiteCount ? GameBoard.black : GameBoard.white
    }

    private func checkWinOnBoard(_ board: [[Int]], row: Int, col: Int, player: Int) -> Bool {
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        let size = GameBoard.size

        for (dr, dc) in directions {
            var count = 1
            for i in 1...4 {
                let r = row + dr * i
                let c = col + dc * i
                guard r >= 0, r < size, c >= 0, c < size, board[r][c] == player else { break }
                count += 1
            }
            for i in 1...4 {
                let r = row - dr * i
                let c = col - dc * i
                guard r >= 0, r < size, c >= 0, c < size, board[r][c] == player else { break }
                count += 1
            }
            if count >= 5 { return true }
        }
        return false
    }

    // MARK: - Evaluation

    func evaluateBoard(board: [[Int]], aiPlayer: Int) -> Int {
        let humanPlayer = aiPlayer == GameBoard.black ? GameBoard.white : GameBoard.black
        var score = 0

        for row in 0..<GameBoard.size {
            for col in 0..<GameBoard.size {
                if board[row][col] == aiPlayer {
                    score += scorePosition(board: board, row: row, col: col, player: aiPlayer)
                } else if board[row][col] == humanPlayer {
                    score -= scorePosition(board: board, row: row, col: col, player: humanPlayer)
                }
            }
        }

        return score
    }

    func scorePosition(board: [[Int]], row: Int, col: Int, player: Int) -> Int {
        var score = 0
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)]

        for (dr, dc) in directions {
            let (count, blocked) = scoreLine(board: board, row: row, col: col, dr: dr, dc: dc, player: player)
            score += patternScore(count: count, blocked: blocked)
        }

        return score
    }

    func scoreLine(board: [[Int]], row: Int, col: Int, dr: Int, dc: Int, player: Int) -> (count: Int, blocked: Int) {
        var count = 1
        var blocked = 0
        let size = GameBoard.size

        // Forward
        for i in 1...4 {
            let r = row + dr * i
            let c = col + dc * i
            guard r >= 0, r < size, c >= 0, c < size else { blocked += 1; break }
            if board[r][c] == player {
                count += 1
            } else if board[r][c] != GameBoard.empty {
                blocked += 1; break
            } else { break }
        }

        // Backward
        for i in 1...4 {
            let r = row - dr * i
            let c = col - dc * i
            guard r >= 0, r < size, c >= 0, c < size else { blocked += 1; break }
            if board[r][c] == player {
                count += 1
            } else if board[r][c] != GameBoard.empty {
                blocked += 1; break
            } else { break }
        }

        return (count, blocked)
    }

    func patternScore(count: Int, blocked: Int) -> Int {
        switch (count, blocked) {
        case (5, _): return GomokuAI.FIVE
        case (4, 0): return GomokuAI.LIVE_FOUR
        case (4, 1): return GomokuAI.RUSH_FOUR
        case (3, 0): return GomokuAI.LIVE_THREE
        case (3, 1): return GomokuAI.SLEEP_THREE
        case (2, 0): return GomokuAI.LIVE_TWO
        case (2, 1): return GomokuAI.SLEEP_TWO
        case (1, 0): return 10
        case (1, 1): return 1
        default: return 0
        }
    }
}
