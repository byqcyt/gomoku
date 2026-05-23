import 'dart:async';
import 'package:flutter/material.dart';
import '../utils/game_board.dart';
import '../utils/game_mode.dart';
import '../utils/gomoku_ai.dart';
import '../widgets/board_painter.dart';

class GamePage extends StatefulWidget {
  const GamePage({super.key});

  @override
  State<GamePage> createState() => _GamePageState();
}

class _GamePageState extends State<GamePage> {
  late GameBoard _board;
  GameMode _mode = GameMode.pveMedium;
  int _modeIdx = 2;
  bool _thinking = false;
  String _status = '当前回合：黑子';
  int _timer = 30;
  Timer? _timerId;
  int _total = 0, _win = 0, _lose = 0;

  @override
  void initState() {
    super.initState();
    _board = GameBoard();
  }

  @override
  void dispose() {
    _timerId?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _stopTimer();
    setState(() => _timer = 30);
    _timerId = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() {
        _timer--;
        if (_timer <= 0) {
          _stopTimer();
          _board.gameOver = true;
          _board.winner = _board.currentPlayer == GameBoard.black
              ? GameBoard.white
              : GameBoard.black;
          _status = '时间到！${_board.winner == GameBoard.black ? '黑子' : '白子'}获胜！';
          _recordResult(_board.winner);
        }
      });
    });
  }

  void _stopTimer() {
    _timerId?.cancel();
    _timerId = null;
  }

  void _recordResult(int winner) {
    _total++;
    if (winner == GameBoard.black) _win++;
    else _lose++;
  }

  void _onBoardTap(TapUpDetails details, double cellSize, double boardOffset) {
    if (_thinking || _board.gameOver) return;

    final dx = details.localPosition.dx - boardOffset;
    final dy = details.localPosition.dy - boardOffset;
    final col = (dx / cellSize).round();
    final row = (dy / cellSize).round();

    if (col < 0 || col >= GameBoard.size || row < 0 || row >= GameBoard.size) return;

    if (_board.placeStone(row, col)) {
      if (_board.gameOver) {
        _stopTimer();
        _recordResult(_board.winner);
      } else {
        _startTimer();
      }
      _updateStatus();
      setState(() {});
      if (!_board.gameOver && _mode != GameMode.pvp) {
        _doAI();
      }
    }
  }

  void _doAI() {
    setState(() => _thinking = true);
    _stopTimer();
    final snap = _board.getBoardCopy();
    final ai = GomokuAI(_mode.depth, _mode.range, _mode.maxCandidates, _mode.randomPick);
    Future.delayed(const Duration(milliseconds: 100), () {
      final move = ai.findBestMove(snap);
      if (!_board.gameOver) {
        _board.placeStone(move[0], move[1]);
        if (_board.gameOver) {
          _stopTimer();
          _recordResult(_board.winner);
        } else {
          _startTimer();
        }
        _updateStatus();
      }
      setState(() => _thinking = false);
    });
  }

  void _updateStatus() {
    if (_board.gameOver) {
      final w = _board.winner == GameBoard.black ? '黑子' : '白子';
      _status = '游戏结束！$w获胜！';
    } else {
      final p = _board.currentPlayer == GameBoard.black ? '黑子' : '白子';
      _status = '当前回合：$p';
    }
  }

  void _undo() {
    if (_thinking) return;
    if (_mode != GameMode.pvp) {
      _board.undoLastMove();
      _board.undoLastMove();
    } else {
      _board.undoLastMove();
    }
    _startTimer();
    _updateStatus();
    setState(() {});
  }

  void _reset() {
    _board.reset();
    _thinking = false;
    _startTimer();
    _updateStatus();
    setState(() {});
  }

  void _switchMode(int idx) {
    setState(() {
      _mode = GameMode.all[idx];
      _modeIdx = idx;
      _reset();
    });
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final cellSize = ((screenWidth - 30 - 10) / (GameBoard.size - 1)).clamp(18.0, 30.0);
    final boardSize = 30 + cellSize * (GameBoard.size - 1);
    final boardOffset = (screenWidth - boardSize) / 2;

    return Scaffold(
      appBar: AppBar(
        title: const Text('神奇的五子棋'),
        centerTitle: true,
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Text(
                '战绩 $_total局 $_win胜 $_lose负',
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: 8),
          // 模式选择
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(GameMode.all.length, (i) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: ChoiceChip(
                  label: Text(GameMode.all[i].name, style: const TextStyle(fontSize: 12)),
                  selected: _modeIdx == i,
                  onSelected: (_) => _switchMode(i),
                ),
              );
            }),
          ),
          const SizedBox(height: 4),
          // 悔棋和重新开始
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(onPressed: _undo, child: const Text('悔棋')),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _reset,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                child: const Text('重新开始', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // 状态和倒计时
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_thinking ? '$_status (AI思考中...)' : _status,
                style: const TextStyle(fontSize: 14)),
              const SizedBox(width: 16),
              if (!_board.gameOver && !_thinking)
                Text('${_timer}s',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: _timer <= 5 ? Colors.red : Colors.grey,
                  )),
            ],
          ),
          const SizedBox(height: 8),
          // 棋盘
          GestureDetector(
            onTapUp: (details) => _onBoardTap(details, cellSize, boardOffset),
            child: CustomPaint(
              size: Size(boardSize, boardSize),
              painter: BoardPainter(gameBoard: _board, cellSize: cellSize),
            ),
          ),
        ],
      ),
    );
  }
}
