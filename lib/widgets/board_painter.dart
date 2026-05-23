import 'package:flutter/material.dart';
import '../utils/game_board.dart';

/// 棋盘绘制组件
class BoardPainter extends CustomPainter {
  final GameBoard gameBoard;
  final double cellSize;
  static const double _pad = 15.0;

  BoardPainter({required this.gameBoard, required this.cellSize});

  @override
  void paint(Canvas canvas, Size size) {
    final boardSize = _pad * 2 + cellSize * (GameBoard.size - 1);

    // 棋盘背景
    final bgPaint = Paint()..color = const Color(0xFFDEB887);
    canvas.drawRect(Rect.fromLTWH(0, 0, boardSize, boardSize), bgPaint);

    // 网格线
    final linePaint = Paint()
      ..color = Colors.black87
      ..strokeWidth = 1.0;
    for (int i = 0; i < GameBoard.size; i++) {
      final p = _pad + i * cellSize;
      canvas.drawLine(Offset(_pad, p), Offset(_pad + (GameBoard.size - 1) * cellSize), linePaint);
      canvas.drawLine(Offset(p, _pad), Offset(p, _pad + (GameBoard.size - 1) * cellSize), linePaint);
    }

    // 星位
    final starPaint = Paint()..color = Colors.black87;
    const stars = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
    for (final s in stars) {
      final cx = _pad + s[1] * cellSize;
      final cy = _pad + s[0] * cellSize;
      canvas.drawCircle(Offset(cx, cy), 3, starPaint);
    }

    // 棋子
    final rad = cellSize * 0.40;
    for (int r = 0; r < GameBoard.size; r++) {
      for (int c = 0; c < GameBoard.size; c++) {
        final v = gameBoard.getCell(r, c);
        if (v == GameBoard.empty) continue;
        final cx = _pad + c * cellSize;
        final cy = _pad + r * cellSize;

        final stonePaint = Paint()
          ..color = v == GameBoard.black ? Colors.black : Colors.white;
        canvas.drawCircle(Offset(cx, cy), rad, stonePaint);

        final borderPaint = Paint()
          ..color = Colors.grey.shade600
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1;
        canvas.drawCircle(Offset(cx, cy), rad, borderPaint);
      }
    }

    // 胜利连线
    if (gameBoard.winLine != null) {
      final wl = gameBoard.winLine!;
      final paint = Paint()
        ..color = Colors.red
        ..strokeWidth = 3;
      canvas.drawLine(
        Offset(_pad + wl[0][1] * cellSize, _pad + wl[0][0] * cellSize),
        Offset(_pad + wl[1][1] * cellSize, _pad + wl[1][0] * cellSize),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant BoardPainter oldDelegate) => true;
}
