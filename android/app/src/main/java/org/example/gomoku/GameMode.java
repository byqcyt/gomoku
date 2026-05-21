package org.example.gomoku;

/**
 * 游戏模式
 */
public enum GameMode {
    /** 人人对战 */
    PVP(0, 0, 0),
    /** 高级人机 */
    PVE_HARD(4, 2, 20),
    /** 中级人机 */
    PVE_MEDIUM(3, 2, 30),
    /** 普通人机 */
    PVE_EASY(1, 1, 0);

    private final int aiDepth;
    private final int candidateRange;
    private final int maxCandidates;

    GameMode(int aiDepth, int candidateRange, int maxCandidates) {
        this.aiDepth = aiDepth;
        this.candidateRange = candidateRange;
        this.maxCandidates = maxCandidates;
    }

    public int getAiDepth() {
        return aiDepth;
    }

    public int getCandidateRange() {
        return candidateRange;
    }

    public int getMaxCandidates() {
        return maxCandidates;
    }

    public boolean isPVE() {
        return this != PVP;
    }
}
