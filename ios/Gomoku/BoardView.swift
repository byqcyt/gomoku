import SwiftUI

struct BoardView: View {
    @ObservedObject var board: GameBoard
    var onMove: ((Int, Int) -> Void)?

    private let boardColor = Color(red: 0.82, green: 0.65, blue: 0.40)
    private let lineWidth: CGFloat = 1.0

    var body: some View {
        GeometryReader { geometry in
            let cellSize = min(geometry.size.width, geometry.size.height) / CGFloat(GameBoard.size + 1)
            let totalWidth = cellSize * CGFloat(GameBoard.size + 1)
            let offsetX = cellSize
            let offsetY = cellSize

            Canvas { context, size in
                // Draw board background
                context.fill(
                    Path(CGRect(x: 0, y: 0, width: totalWidth, height: totalWidth)),
                    with: .color(boardColor)
                )

                // Draw grid lines
                var gridPath = Path()
                for i in 0..<GameBoard.size {
                    // Horizontal lines
                    let hy = offsetY + cellSize * CGFloat(i)
                    gridPath.move(to: CGPoint(x: offsetX, y: hy))
                    gridPath.addLine(to: CGPoint(x: offsetX + cellSize * CGFloat(GameBoard.size - 1), y: hy))

                    // Vertical lines
                    let vx = offsetX + cellSize * CGFloat(i)
                    gridPath.move(to: CGPoint(x: vx, y: offsetY))
                    gridPath.addLine(to: CGPoint(x: vx, y: offsetY + cellSize * CGFloat(GameBoard.size - 1)))
                }
                context.stroke(gridPath, with: .color(.black), lineWidth: lineWidth)

                // Draw star points (tenkoku)
                let starPoints: [(Int, Int)] = [
                    (3, 3), (3, 7), (3, 11),
                    (7, 3), (7, 7), (7, 11),
                    (11, 3), (11, 7), (11, 11)
                ]
                for (r, c) in starPoints {
                    let center = CGPoint(
                        x: offsetX + cellSize * CGFloat(c),
                        y: offsetY + cellSize * CGFloat(r)
                    )
                    let radius = cellSize * 0.12
                    let rect = CGRect(x: center.x - radius, y: center.y - radius,
                                     width: radius * 2, height: radius * 2)
                    context.fill(Path(ellipseIn: rect), with: .color(.black))
                }

                // Draw stones
                let stoneRadius = cellSize * 0.43
                for row in 0..<GameBoard.size {
                    for col in 0..<GameBoard.size {
                        let piece = board.board[row][col]
                        guard piece != GameBoard.empty else { continue }

                        let center = CGPoint(
                            x: offsetX + cellSize * CGFloat(col),
                            y: offsetY + cellSize * CGFloat(row)
                        )
                        let rect = CGRect(x: center.x - stoneRadius, y: center.y - stoneRadius,
                                         width: stoneRadius * 2, height: stoneRadius * 2)
                        let stonePath = Path(ellipseIn: rect)

                        if piece == GameBoard.black {
                            // Black stone with gradient
                            context.fill(stonePath, with: .color(.black))
                            context.stroke(stonePath, with: .color(.gray.opacity(0.3)), lineWidth: 0.5)
                        } else {
                            // White stone with gradient
                            context.fill(stonePath, with: .color(.white))
                            context.stroke(stonePath, with: .color(.gray), lineWidth: 0.5)
                        }
                    }
                }

                // Draw win line
                if !board.winLine.isEmpty {
                    let points = board.winLine.sorted { ($0.row, $0.col) < ($1.row, $1.col) }
                        .map { (row, col) in
                            CGPoint(
                                x: offsetX + cellSize * CGFloat(col),
                                y: offsetY + cellSize * CGFloat(row)
                            )
                        }
                    if points.count >= 2 {
                        var winPath = Path()
                        winPath.move(to: points[0])
                        for pt in points.dropFirst() {
                            winPath.addLine(to: pt)
                        }
                        context.stroke(winPath, with: .color(.red), lineWidth: 3)
                    }
                }
            }
            .frame(width: totalWidth, height: totalWidth)
            .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
            .onTapGesture { location in
                guard !board.gameOver else { return }
                let col = Int(round((location.x - offsetX) / cellSize))
                let row = Int(round((location.y - offsetY) / cellSize))
                guard row >= 0, row < GameBoard.size,
                      col >= 0, col < GameBoard.size else { return }
                onMove?(row, col)
            }
        }
        .aspectRatio(1, contentMode: .fit)
    }
}
