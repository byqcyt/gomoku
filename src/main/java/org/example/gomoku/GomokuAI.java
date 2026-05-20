package org.example.gomoku;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;

/**
 * 五子棋AI - Minimax + Alpha-Beta剪枝
 * AI执白子（WHITE）
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
    private final int candidateRange;
    private final int maxCandidates;
    private final boolean randomPick;
    private final Random random = new Random();

    public GomokuAI(int depth, int candidateRange, int maxCandidates, boolean randomPick) {
        this.depth = depth;
        this.candidateRange = candidateRange;
        this.maxCandidates = maxCandidates;
        this.randomPick = randomPick;
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

        // 先用快速启发式排序，截取topN减少搜索量
        if (maxCandidates > 0 && candidates.size() > maxCandidates) {
            candidates = selectTopCandidates(local, candidates, maxCandidates);
        }

        // 计算每个候选的深度搜索分数
        List<ScoredMove> scored = new ArrayList<>();
        for (int[] move : candidates) {
            local[move[0]][move[1]] = WHITE;
            int score = minimax(local, depth - 1, Integer.MIN_VALUE, Integer.MAX_VALUE, false, 15);
            local[move[0]][move[1]] = EMPTY;
            scored.add(new ScoredMove(move, score));
        }

        scored.sort(Comparator.comparingInt((ScoredMove s) -> s.score).reversed());

        if (randomPick && scored.size() > 1) {
            int top = Math.min(3, scored.size());
            return scored.get(random.nextInt(top)).move;
        }

        return scored.get(0).move;
    }

    /**
     * 用快速启发式评估每个候选位置，选出topN
     */
    private List<int[]> selectTopCandidates(int[][] board, List<int[]> candidates, int topN) {
        List<ScoredMove> scored = new ArrayList<>();
        for (int[] move : candidates) {
            board[move[0]][move[1]] = WHITE;
            int score = quickScore(board, move[0], move[1]);
            board[move[0]][move[1]] = EMPTY;
            scored.add(new ScoredMove(move, score));
        }
        // 也检查对手的威胁
        for (int[] move : candidates) {
            if (board[move[0]][move[1]] != EMPTY) continue;
            board[move[0]][move[1]] = BLACK;
            int threat = quickScore(board, move[0], move[1]);
            board[move[0]][move[1]] = EMPTY;
            // 找到对应的scored项并加上威胁分
            for (ScoredMove sm : scored) {
                if (sm.move[0] == move[0] && sm.move[1] == move[1]) {
                    sm.defenseScore = threat;
                    break;
                }
            }
        }
        scored.sort(Comparator.comparingInt((ScoredMove s) -> -(s.score + s.defenseScore)));
        List<int[]> result = new ArrayList<>();
        for (int i = 0; i < Math.min(topN, scored.size()); i++) {
            result.add(scored.get(i).move);
        }
        return result;
    }

    /**
     * 快速评估：只检查落子位置周围的4条线
     */
    private int quickScore(int[][] board, int row, int col) {
        int score = 0;
        int[][] dirs = {{0, 1}, {1, 0}, {1, 1}, {1, -1}};
        for (int[] dir : dirs) {
            int count = countLine(board, row, col, dir[0], dir[1]);
            int open = countOpenEnds(board, row, col, dir[0], dir[1]);
            score += patternScore(count, open);
        }
        return score;
    }

    private int countLine(int[][] board, int row, int col, int dr, int dc) {
        int player = board[row][col];
        int count = 1;
        for (int i = 1; i < 5; i++) {
            int r = row + dr * i, c = col + dc * i;
            if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == player) count++;
            else break;
        }
        for (int i = 1; i < 5; i++) {
            int r = row - dr * i, c = col - dc * i;
            if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == player) count++;
            else break;
        }
        return count;
    }

    private int countOpenEnds(int[][] board, int row, int col, int dr, int dc) {
        int open = 0;
        int r = row + dr, c = col + dc;
        while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == board[row][col]) {
            r += dr; c += dc;
        }
        if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == EMPTY) open++;
        r = row - dr; c = col - dc;
        while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == board[row][col]) {
            r -= dr; c -= dc;
        }
        if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == EMPTY) open++;
        return open;
    }

    private int minimax(int[][] board, int depth, int alpha, int beta, boolean maximizing, int limit) {
        if (depth == 0) {
            return evaluateBoard(board);
        }
        List<int[]> candidates = getCandidates(board);
        if (candidates.isEmpty()) {
            return evaluateBoard(board);
        }
        // 内层搜索也限制候选数量
        if (candidates.size() > limit) {
            candidates = selectTopCandidates(board, candidates, limit);
        }

        if (maximizing) {
            int maxEval = Integer.MIN_VALUE;
            for (int[] move : candidates) {
                board[move[0]][move[1]] = WHITE;
                int eval = minimax(board, depth - 1, alpha, beta, false, limit);
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
                int eval = minimax(board, depth - 1, alpha, beta, true, limit);
                board[move[0]][move[1]] = EMPTY;
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    /**
     * 候选落子：已有棋子周围 candidateRange 格范围内的空位
     */
    private List<int[]> getCandidates(int[][] board) {
        boolean[][] near = new boolean[SIZE][SIZE];
        boolean hasStones = false;

        for (int r = 0; r < SIZE; r++) {
            for (int c = 0; c < SIZE; c++) {
                if (board[r][c] != EMPTY) {
                    hasStones = true;
                    for (int dr = -candidateRange; dr <= candidateRange; dr++) {
                        for (int dc = -candidateRange; dc <= candidateRange; dc++) {
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
     */
    private int evaluateBoard(int[][] board) {
        int aiScore = 0, humanScore = 0;

        for (int r = 0; r < SIZE; r++) {
            int[] line = new int[SIZE];
            for (int c = 0; c < SIZE; c++) line[c] = board[r][c];
            int[] scores = scoreLine(line);
            aiScore += scores[0];
            humanScore += scores[1];
        }
        for (int c = 0; c < SIZE; c++) {
            int[] line = new int[SIZE];
            for (int r = 0; r < SIZE; r++) line[r] = board[r][c];
            int[] scores = scoreLine(line);
            aiScore += scores[0];
            humanScore += scores[1];
        }
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

    private static class ScoredMove {
        final int[] move;
        final int score;
        int defenseScore;
        ScoredMove(int[] move, int score) {
            this.move = move;
            this.score = score;
        }
    }
}
