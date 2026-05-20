package org.example.gomoku;

/**
 * 游戏模式
 */
public enum GameMode {
    /** 人人对战 */
    PVP(0, 0),
    /** 高级人机 */
    PVE_HARD(5, 2),
    /** 中级人机 */
    PVE_MEDIUM(3, 2),
    /** 普通人机 */
    PVE_EASY(1, 1);

    private final int aiDepth;
    private final int candidateRange;

    GameMode(int aiDepth, int candidateRange) {
        this.aiDepth = aiDepth;
        this.candidateRange = candidateRange;
    }

    public int getAiDepth() {
        return aiDepth;
    }

    public int getCandidateRange() {
        return candidateRange;
    }

    public boolean isPVE() {
        return this != PVP;
    }
}
