import Foundation
import Combine

class GameBoard: ObservableObject {
    static let size = 15
    static let empty = 0
    static let black = 1
    static let white = 2

    @Published var board: [[Int]]
    @Published var currentPlayer: Int
    @Published var gameOver: Bool
    @Published var winner: Int
    @Published var winLine: [(row: Int, col: Int)]
    @Published var moveHistory: [(row: Int, col: Int, player: Int)]

    init() {
        board = Array(repeating: Array(repeating: 0, count: GameBoard.size), count: GameBoard.size)
        currentPlayer = GameBoard.black
        gameOver = false
        winner = 0
        winLine = []
        moveHistory = []
    }

    func reset() {
        board = Array(repeating: Array(repeating: 0, count: GameBoard.size), count: GameBoard.size)
        currentPlayer = GameBoard.black
        gameOver = false
        winner = 0
        winLine = []
        moveHistory = []
    }

    func placeStone(row: Int, col: Int) -> Bool {
        guard row >= 0, row < GameBoard.size,
              col >= 0, col < GameBoard.size,
              board[row][col] == GameBoard.empty,
              !gameOver else {
            return false
        }

        board[row][col] = currentPlayer
        moveHistory.append((row: row, col: col, player: currentPlayer))

        if checkWin(row: row, col: col) {
            gameOver = true
            winner = currentPlayer
        } else if moveHistory.count == GameBoard.size * GameBoard.size {
            gameOver = true
            winner = 0
        } else {
            currentPlayer = currentPlayer == GameBoard.black ? GameBoard.white : GameBoard.black
        }

        return true
    }

    func checkWin(row: Int, col: Int) -> Bool {
        let player = board[row][col]
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)]

        for (dr, dc) in directions {
            var line: [(row: Int, col: Int)] = [(row: row, col: col)]

            // Check forward
            for i in 1...4 {
                let r = row + dr * i
                let c = col + dc * i
                guard r >= 0, r < GameBoard.size,
                      c >= 0, c < GameBoard.size,
                      board[r][c] == player else { break }
                line.append((row: r, col: c))
            }

            // Check backward
            for i in 1...4 {
                let r = row - dr * i
                let c = col - dc * i
                guard r >= 0, r < GameBoard.size,
                      c >= 0, c < GameBoard.size,
                      board[r][c] == player else { break }
                line.append((row: r, col: c))
            }

            if line.count >= 5 {
                winLine = line
                return true
            }
        }

        winLine = []
        return false
    }

    func undoLastMove() -> Bool {
        guard let lastMove = moveHistory.popLast() else {
            return false
        }

        board[lastMove.row][lastMove.col] = GameBoard.empty
        currentPlayer = lastMove.player
        gameOver = false
        winner = 0
        winLine = []
        return true
    }

    func getBoardCopy() -> [[Int]] {
        return board.map { $0 }
    }
}
