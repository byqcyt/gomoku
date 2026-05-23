import 'package:flutter_test/flutter_test.dart';
import 'package:gomoku/utils/game_board.dart';

void main() {
  group('GameBoard', () {
    test('初始状态正确', () {
      final board = GameBoard();
      expect(board.currentPlayer, GameBoard.black);
      expect(board.gameOver, false);
      expect(board.winner, GameBoard.empty);
    });

    test('落子成功', () {
      final board = GameBoard();
      expect(board.placeStone(7, 7), true);
      expect(board.getCell(7, 7), GameBoard.black);
      expect(board.currentPlayer, GameBoard.white);
    });

    test('不能重复落子', () {
      final board = GameBoard();
      board.placeStone(7, 7);
      expect(board.placeStone(7, 7), false);
    });

    test('五子连珠判定胜利', () {
      final board = GameBoard();
      for (int i = 0; i < 5; i++) {
        board.placeStone(0, i); // 黑子
        if (i < 4) board.placeStone(1, i); // 白子
      }
      expect(board.gameOver, true);
      expect(board.winner, GameBoard.black);
    });

    test('悔棋成功', () {
      final board = GameBoard();
      board.placeStone(7, 7);
      expect(board.undoLastMove(), true);
      expect(board.getCell(7, 7), GameBoard.empty);
      expect(board.currentPlayer, GameBoard.black);
    });

    test('重置棋盘', () {
      final board = GameBoard();
      board.placeStone(7, 7);
      board.placeStone(7, 8);
      board.reset();
      expect(board.getCell(7, 7), GameBoard.empty);
      expect(board.currentPlayer, GameBoard.black);
    });
  });
}
