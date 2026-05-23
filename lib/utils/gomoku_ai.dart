import 'dart:math';
import 'game_board.dart';

/// 五子棋AI - Minimax + Alpha-Beta剪枝
/// AI执白子
class GomokuAI {
  static const int _scoreFive = 1000000;
  static const int _scoreLiveFour = 50000;
  static const int _scoreRushFour = 5000;
  static const int _scoreLiveThree = 5000;
  static const int _scoreSleepThree = 500;
  static const int _scoreLiveTwo = 500;
  static const int _scoreSleepTwo = 50;

  final int depth;
  final int candidateRange;
  final int maxCandidates;
  final bool randomPick;
  final Random _random = Random();

  GomokuAI(this.depth, this.candidateRange, this.maxCandidates, this.randomPick);

  /// 搜索最佳落子位置
  List<int> findBestMove(List<List<int>> board) {
    final local = _copyBoard(board);
    var candidates = _getCandidates(local);
    if (candidates.isEmpty) return [7, 7];

    if (maxCandidates > 0 && candidates.length > maxCandidates) {
      candidates = _selectTopCandidates(local, candidates, maxCandidates);
    }

    final scored = <({List<int> move, int score})>[];
    for (final move in candidates) {
      local[move[0]][move[1]] = GameBoard.white;
      final score = _minimax(local, depth - 1, -999999999, 999999999, false, 15);
      local[move[0]][move[1]] = GameBoard.empty;
      scored.add((move: move, score: score));
    }

    scored.sort((a, b) => b.score.compareTo(a.score));

    if (randomPick && scored.length > 1) {
      final top = min(3, scored.length);
      return scored[_random.nextInt(top)].move;
    }
    return scored[0].move;
  }

  List<List<int>> _selectTopCandidates(
    List<List<int>> board, List<List<int>> candidates, int topN,
  ) {
    final scored = <({List<int> move, int score, int defense})>[];

    for (final move in candidates) {
      board[move[0]][move[1]] = GameBoard.white;
      final score = _quickScore(board, move[0], move[1]);
      board[move[0]][move[1]] = GameBoard.empty;
      scored.add((move: move, score: score, defense: 0));
    }

    for (final move in candidates) {
      if (board[move[0]][move[1]] != GameBoard.empty) continue;
      board[move[0]][move[1]] = GameBoard.black;
      final threat = _quickScore(board, move[0], move[1]);
      board[move[0]][move[1]] = GameBoard.empty;
      for (final s in scored) {
        if (s.move[0] == move[0] && s.move[1] == move[1]) {
          s.defense = threat;
          break;
        }
      }
    }

    scored.sort((a, b) => (b.score + b.defense).compareTo(a.score + a.defense));
    return scored.take(topN).map((s) => s.move).toList();
  }

  int _quickScore(List<List<int>> board, int row, int col) {
    int score = 0;
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (final dir in dirs) {
      final count = _countLine(board, row, col, dir[0], dir[1]);
      final open = _countOpenEnds(board, row, col, dir[0], dir[1]);
      score += _patternScore(count, open);
    }
    return score;
  }

  int _countLine(List<List<int>> board, int row, int col, int dr, int dc) {
    final player = board[row][col];
    int count = 1;
    for (int i = 1; i < 5; i++) {
      final r = row + dr * i, c = col + dc * i;
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] == player) {
        count++;
      } else {
        break;
      }
    }
    for (int i = 1; i < 5; i++) {
      final r = row - dr * i, c = col - dc * i;
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] == player) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  int _countOpenEnds(List<List<int>> board, int row, int col, int dr, int dc) {
    final player = board[row][col];
    int open = 0;
    var r = row + dr;
    var c = col + dc;
    while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] == player) {
      r += dr;
      c += dc;
    }
    if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] == GameBoard.empty) open++;
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] == player) {
      r -= dr;
      c -= dc;
    }
    if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] == GameBoard.empty) open++;
    return open;
  }

  int _minimax(
    List<List<int>> board, int depth, int alpha, int beta, bool maximizing, int limit,
  ) {
    if (depth == 0) return _evaluateBoard(board);
    var candidates = _getCandidates(board);
    if (candidates.isEmpty) return _evaluateBoard(board);
    if (candidates.length > limit) {
      candidates = _selectTopCandidates(board, candidates, limit);
    }

    if (maximizing) {
      int maxEval = -999999999;
      for (final move in candidates) {
        board[move[0]][move[1]] = GameBoard.white;
        final eval = _minimax(board, depth - 1, alpha, beta, false, limit);
        board[move[0]][move[1]] = GameBoard.empty;
        if (eval > maxEval) maxEval = eval;
        if (eval > alpha) alpha = eval;
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      int minEval = 999999999;
      for (final move in candidates) {
        board[move[0]][move[1]] = GameBoard.black;
        final eval = _minimax(board, depth - 1, alpha, beta, true, limit);
        board[move[0]][move[1]] = GameBoard.empty;
        if (eval < minEval) minEval = eval;
        if (eval < beta) beta = eval;
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  List<List<int>> _getCandidates(List<List<int>> board) {
    final near = List.generate(15, (_) => List.filled(15, false));
    bool hasStones = false;

    for (int r = 0; r < 15; r++) {
      for (int c = 0; c < 15; c++) {
        if (board[r][c] != GameBoard.empty) {
          hasStones = true;
          for (int dr = -candidateRange; dr <= candidateRange; dr++) {
            for (int dc = -candidateRange; dc <= candidateRange; dc++) {
              final nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] == GameBoard.empty) {
                near[nr][nc] = true;
              }
            }
          }
        }
      }
    }

    if (!hasStones) return [[7, 7]];

    final result = <List<int>>[];
    for (int r = 0; r < 15; r++) {
      for (int c = 0; c < 15; c++) {
        if (near[r][c]) result.add([r, c]);
      }
    }
    return result;
  }

  int _evaluateBoard(List<List<int>> board) {
    int aiScore = 0, humanScore = 0;

    for (int r = 0; r < 15; r++) {
      final scores = _scoreLine(board[r]);
      aiScore += scores[0];
      humanScore += scores[1];
    }
    for (int c = 0; c < 15; c++) {
      final line = [for (int r = 0; r < 15; r++) board[r][c]];
      final scores = _scoreLine(line);
      aiScore += scores[0];
      humanScore += scores[1];
    }
    for (int start = -14; start < 15; start++) {
      final line = <int>[];
      for (int r = 0; r < 15; r++) {
        final c = r - start;
        if (c >= 0 && c < 15) line.add(board[r][c]);
      }
      if (line.length >= 2) {
        final scores = _scoreLine(line);
        aiScore += scores[0];
        humanScore += scores[1];
      }
    }
    for (int start = 0; start < 29; start++) {
      final line = <int>[];
      for (int r = 0; r < 15; r++) {
        final c = start - r;
        if (c >= 0 && c < 15) line.add(board[r][c]);
      }
      if (line.length >= 2) {
        final scores = _scoreLine(line);
        aiScore += scores[0];
        humanScore += scores[1];
      }
    }
    return aiScore - humanScore;
  }

  List<int> _scoreLine(List<int> line) {
    int aiScore = 0, humanScore = 0;
    int i = 0;
    while (i < line.length) {
      if (line[i] == GameBoard.empty) {
        i++;
        continue;
      }
      final player = line[i];
      int count = 1;
      int j = i + 1;
      while (j < line.length && line[j] == player) {
        count++;
        j++;
      }
      int openEnds = 0;
      if (i > 0 && line[i - 1] == GameBoard.empty) openEnds++;
      if (j < line.length && line[j] == GameBoard.empty) openEnds++;

      final score = _patternScore(count, openEnds);
      if (player == GameBoard.white) {
        aiScore += score;
      } else {
        humanScore += score;
      }
      i = j;
    }
    return [aiScore, humanScore];
  }

  int _patternScore(int count, int openEnds) {
    if (count >= 5) return _scoreFive;
    if (openEnds == 0) return 0;
    if (count == 4) return openEnds == 2 ? _scoreLiveFour : _scoreRushFour;
    if (count == 3) return openEnds == 2 ? _scoreLiveThree : _scoreSleepThree;
    if (count == 2) return openEnds == 2 ? _scoreLiveTwo : _scoreSleepTwo;
    return 0;
  }

  List<List<int>> _copyBoard(List<List<int>> board) {
    return board.map((row) => List<int>.from(row)).toList();
  }
}
