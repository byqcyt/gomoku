/// 游戏模式定义
class GameMode {
  final String name;
  final int depth;
  final int range;
  final int maxCandidates;
  final bool randomPick;

  const GameMode({
    required this.name,
    required this.depth,
    required this.range,
    required this.maxCandidates,
    required this.randomPick,
  });

  static const pvp = GameMode(
    name: '人人对战', depth: 0, range: 0, maxCandidates: 0, randomPick: false,
  );
  static const pveHard = GameMode(
    name: '高级人机', depth: 4, range: 2, maxCandidates: 20, randomPick: false,
  );
  static const pveMedium = GameMode(
    name: '中级人机', depth: 3, range: 2, maxCandidates: 30, randomPick: false,
  );
  static const pveEasy = GameMode(
    name: '普通人机', depth: 1, range: 1, maxCandidates: 0, randomPick: true,
  );

  static const List<GameMode> all = [pvp, pveHard, pveMedium, pveEasy];
}
