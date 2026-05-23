/// 五子棋棋盘逻辑
class GameBoard {
  static const int size = 15;
  static const int empty = 0;
  static const int black = 1;
  static const int white = 2;

  late List<List<int>> board;
  int currentPlayer = black;
  bool gameOver = false;
  int winner = empty;
  List<List<int>>? winLine;
  final List<List<int>> moveHistory = [];

  GameBoard() {
    board = List.generate(size, (_) => List.filled(size, empty));
    reset();
  }

  void reset() {
    for (var row in board) {
      row.fillRange(0, size, empty);
    }
    currentPlayer = black;
    gameOver = false;
    winner = empty;
    winLine = null;
    moveHistory.clear();
  }

  /// 在指定位置落子，返回是否成功
  bool placeStone(int row, int col) {
    if (gameOver || row < 0 || row >= size || col < 0 || col >= size) {
      return false;
    }
    if (board[row][col] != empty) {
      return false;
    }
    board[row][col] = currentPlayer;
    moveHistory.add([row, col, currentPlayer]);

    if (checkWin(row, col)) {
      winner = currentPlayer;
      gameOver = true;
    } else {
      currentPlayer = (currentPlayer == black) ? white : black;
    }
    return true;
  }

  bool checkWin(int row, int col) {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    final player = board[row][col];

    for (final dir in directions) {
      final dr = dir[0], dc = dir[1];
      int count = 1;
      int startRow = row, startCol = col;
      int endRow = row, endCol = col;

      for (int i = 1; i < 5; i++) {
        final r = row + dr * i, c = col + dc * i;
        if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] == player) {
          count++;
          endRow = r;
          endCol = c;
        } else {
          break;
        }
      }
      for (int i = 1; i < 5; i++) {
        final r = row - dr * i, c = col - dc * i;
        if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] == player) {
          count++;
          startRow = r;
          startCol = c;
        } else {
          break;
        }
      }

      if (count >= 5) {
        winLine = [[startRow, startCol], [endRow, endCol]];
        return true;
      }
    }
    return false;
  }

  int getCell(int row, int col) => board[row][col];

  /// 返回棋盘深拷贝，供AI线程安全使用
  List<List<int>> getBoardCopy() {
    return board.map((row) => List<int>.from(row)).toList();
  }

  /// 悔一步棋
  bool undoLastMove() {
    if (moveHistory.isEmpty) return false;
    final last = moveHistory.removeLast();
    board[last[0]][last[1]] = empty;
    currentPlayer = last[2];
    gameOver = false;
    winner = empty;
    winLine = null;
    return true;
  }
}
