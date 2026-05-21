export const GameMode = {
  PVP: { name: '人人对战', depth: 0, range: 0, maxCandidates: 0, randomPick: false },
  PVE_HARD: { name: '高级人机', depth: 4, range: 2, maxCandidates: 20, randomPick: false },
  PVE_MEDIUM: { name: '中级人机', depth: 3, range: 2, maxCandidates: 30, randomPick: false },
  PVE_EASY: { name: '普通人机', depth: 1, range: 1, maxCandidates: 0, randomPick: true }
}
