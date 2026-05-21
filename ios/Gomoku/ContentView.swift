import SwiftUI

struct ContentView: View {
    @StateObject private var board = GameBoard()
    @State private var gameMode: GameMode = .pvp
    @State private var isAIThinking: Bool = false

    var body: some View {
        VStack(spacing: 0) {
            // Mode picker
            Picker("游戏模式", selection: $gameMode) {
                ForEach(GameMode.allCases, id: \.self) { mode in
                    Text(mode.displayName).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)
            .onChange(of: gameMode) { _ in
                board.reset()
                isAIThinking = false
            }

            // Game board
            BoardView(board: board) { row, col in
                handleMove(row: row, col: col)
            }

            // Status bar
            HStack(spacing: 16) {
                Text(statusText)
                    .font(.headline)
                    .foregroundColor(statusColor)

                if isAIThinking {
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }
            .padding()
        }
        .navigationTitle("五子棋")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Button("悔棋") {
                    undoMove()
                }
                .disabled(board.moveHistory.isEmpty || board.gameOver || isAIThinking)

                Button("重新开始") {
                    board.reset()
                    isAIThinking = false
                }
            }
        }
    }

    private var statusText: String {
        if isAIThinking {
            return "AI 思考中..."
        }
        if board.gameOver {
            if board.winner == 0 {
                return "平局！"
            } else {
                let winnerName = board.winner == GameBoard.black ? "黑棋" : "白棋"
                return "\(winnerName) 获胜！"
            }
        }
        let turnName = board.currentPlayer == GameBoard.black ? "黑棋" : "白棋"
        return "\(turnName) 落子"
    }

    private var statusColor: Color {
        if board.gameOver && board.winner != 0 {
            return .red
        }
        return .primary
    }

    // MARK: - Game Actions

    private func handleMove(row: Int, col: Int) {
        guard !isAIThinking, !board.gameOver else { return }

        // In PVE mode, human plays as black (first) and AI plays as white
        if gameMode.isPVE && board.currentPlayer != GameBoard.black {
            return
        }

        let placed = board.placeStone(row: row, col: col)
        guard placed else { return }

        if gameMode.isPVE && !board.gameOver {
            triggerAI()
        }
    }

    private func triggerAI() {
        isAIThinking = true
        let boardCopy = board.getBoardCopy()

        DispatchQueue.global(qos: .userInitiated).async {
            let ai = GomokuAI(
                depth: gameMode.aiDepth,
                candidateRange: gameMode.candidateRange,
                maxCandidates: gameMode.maxCandidates
            )
            let move = ai.findBestMove(board: boardCopy, aiPlayer: GameBoard.white)

            DispatchQueue.main.async {
                self.isAIThinking = false
                if let move = move {
                    _ = self.board.placeStone(row: move.row, col: move.col)
                }
            }
        }
    }

    private func undoMove() {
        guard !isAIThinking else { return }

        if gameMode.isPVE {
            // Undo two moves: human + AI
            _ = board.undoLastMove()
            _ = board.undoLastMove()
        } else {
            _ = board.undoLastMove()
        }
    }
}
