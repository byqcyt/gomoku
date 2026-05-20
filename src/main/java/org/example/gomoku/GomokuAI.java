package org.example.gomoku;

import java.util.ArrayList;
import java.util.List;

/**
 * 五子棋AI - Minimax + Alpha-Beta剪枝
 * AI执白子（WHITE），深度默认3
 */
public class GomokuAI {

    private static final int SIZE = GameBoard.SIZE;
    private static final int EMPTY = GameBoard.EMPTY;
    private static final int BLACK = GameBoard.BLACK;
    private static final int WHITE = GameBoard.WHITE;

    // 棋型评分
    private static final int SCORE_FIVE = 1_000_000;
    private static final int SCORE_LIVE_FOUR = 50_000;
    private static final int SCORE_RUSH_FOUR = 5_000;
    private static final int SCORE_LIVE_THREE = 5_000;
    private static final int SCORE_SLEEP_THREE = 500;
    private static final int SCORE_LIVE_TWO = 500;
    private static final int SCORE_SLEEP_TWO = 50;

    private final int depth;

    public GomokuAI(int depth) {
        this.depth = depth;
    }

    /**
     * 在独立副本上搜索最佳落子位置
     * @return {row, col} 或 null
     */
    public int[] findBestMove(int[][] board) {
        int[][] local = copyBoard(board);
        List<int[]> candidates = getCandidates(local);
        if (candidates.isEmpty()) {
            return new int[]{7, 7};
        }

        int bestScore = Integer.MIN_VALUE;
        int[] bestMove = candidates.get(0);

        for (int[] move : candidates) {
            local[move[0]][move[1]] = WHITE;
            int score = minimax(local, depth - 1, Integer.MIN_VALUE, Integer.MAX_VALUE, false);
            local[move[0]][move[1]] = EMPTY;
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }

    private int minimax(int[][] board, int depth, int alpha, int beta, boolean maximizing) {
        if (depth == 0) {
            return evaluateBoard(board);
        }
        List<int[]> candidates = getCandidates(board);
        if (candidates.isEmpty()) {
            return evaluateBoard(board);
        }

        if (maximizing) {
            int maxEval = Integer.MIN_VALUE;
            for (int[] move : candidates) {
                board[move[0]][move[1]] = WHITE;
                int eval = minimax(board, depth - 1, alpha, beta, false);
                board[move[0]][move[1]] = EMPTY;
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            int minEval = Integer.MAX_VALUE;
            for (int[] move : candidates) {
                board[move[0]][move[1]] = BLACK;
                int eval = minimax(board, depth - 1, alpha, beta, true);
                board[move[0]][move[1]] = EMPTY;
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    /**
     * 候选落子：已有棋子周围2格范围内的空位
     */
    private List<int[]> getCandidates(int[][] board) {
        boolean[][] near = new boolean[SIZE][SIZE];
        boolean hasStones = false;

        for (int r = 0; r < SIZE; r++) {
            for (int c = 0; c < SIZE; c++) {
                if (board[r][c] != EMPTY) {
                    hasStones = true;
                    for (int dr = -2; dr <= 2; dr++) {
                        for (int dc = -2; dc <= 2; dc++) {
                            int nr = r + dr, nc = c + dc;
                            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] == EMPTY) {
                                near[nr][nc] = true;
                            }
                        }
                    }
                }
            }
        }

        if (!hasStones) {
            List<int[]> result = new ArrayList<>();
            result.add(new int[]{7, 7});
            return result;
        }

        List<int[]> result = new ArrayList<>();
        for (int r = 0; r < SIZE; r++) {
            for (int c = 0; c < SIZE; c++) {
                if (near[r][c]) result.add(new int[]{r, c});
            }
        }
        return result;
    }

    /**
     * 评估函数：扫描所有行、列、对角线，按棋型评分
     * 从AI（WHITE）视角：AI得分 - 人类得分
     */
    private int evaluateBoard(int[][] board) {
        int aiScore = 0, humanScore = 0;

        // 扫描所有行
        for (int r = 0; r < SIZE; r++) {
            int[] line = new int[SIZE];
            for (int c = 0; c < SIZE; c++) line[c] = board[r][c];
            int[] scores = scoreLine(line);
            aiScore += scores[0];
            humanScore += scores[1];
        }
        // 扫描所有列
        for (int c = 0; c < SIZE; c++) {
            int[] line = new int[SIZE];
            for (int r = 0; r < SIZE; r++) line[r] = board[r][c];
            int[] scores = scoreLine(line);
            aiScore += scores[0];
            humanScore += scores[1];
        }
        // 扫描对角线（从左上到右下）
        for (int start = -SIZE + 1; start < SIZE; start++) {
            List<Integer> lineList = new ArrayList<>();
            for (int r = 0; r < SIZE; r++) {
                int c = r - start;
                if (c >= 0 && c < SIZE) lineList.add(board[r][c]);
            }
            if (lineList.size() >= 2) {
                int[] line = lineList.stream().mapToInt(Integer::intValue).toArray();
                int[] scores = scoreLine(line);
                aiScore += scores[0];
                humanScore += scores[1];
            }
        }
        // 扫描对角线（从右上到左下）
        for (int start = 0; start < 2 * SIZE - 1; start++) {
            List<Integer> lineList = new ArrayList<>();
            for (int r = 0; r < SIZE; r++) {
                int c = start - r;
                if (c >= 0 && c < SIZE) lineList.add(board[r][c]);
            }
            if (lineList.size() >= 2) {
                int[] line = lineList.stream().mapToInt(Integer::intValue).toArray();
                int[] scores = scoreLine(line);
                aiScore += scores[0];
                humanScore += scores[1];
            }
        }
        return aiScore - humanScore;
    }

    /**
     * 评估单条线：返回 {aiScore, humanScore}
     */
    private int[] scoreLine(int[] line) {
        int aiScore = 0, humanScore = 0;
        int i = 0;
        while (i < line.length) {
            if (line[i] == EMPTY) {
                i++;
                continue;
            }
            int player = line[i];
            int count = 1;
            int j = i + 1;
            while (j < line.length && line[j] == player) {
                count++;
                j++;
            }
            // 前端开放
            int openEnds = 0;
            if (i > 0 && line[i - 1] == EMPTY) openEnds++;
            if (j < line.length && line[j] == EMPTY) openEnds++;

            int score = patternScore(count, openEnds);
            if (player == WHITE) aiScore += score;
            else humanScore += score;

            i = j;
        }
        return new int[]{aiScore, humanScore};
    }

    private int patternScore(int count, int openEnds) {
        if (count >= 5) return SCORE_FIVE;
        if (openEnds == 0) return 0;
        if (count == 4) return openEnds == 2 ? SCORE_LIVE_FOUR : SCORE_RUSH_FOUR;
        if (count == 3) return openEnds == 2 ? SCORE_LIVE_THREE : SCORE_SLEEP_THREE;
        if (count == 2) return openEnds == 2 ? SCORE_LIVE_TWO : SCORE_SLEEP_TWO;
        return 0;
    }

    private int[][] copyBoard(int[][] board) {
        int[][] copy = new int[SIZE][SIZE];
        for (int i = 0; i < SIZE; i++) {
            copy[i] = java.util.Arrays.copyOf(board[i], SIZE);
        }
        return copy;
    }
}
