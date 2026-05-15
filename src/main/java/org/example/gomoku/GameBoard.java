package org.example.gomoku;

/**
 * 五子棋棋盘逻辑
 */
public class GameBoard {

    public static final int SIZE = 15;
    public static final int EMPTY = 0;
    public static final int BLACK = 1;
    public static final int WHITE = 2;

    private final int[][] board;
    private int currentPlayer;
    private boolean gameOver;
    private int winner;
    private int[][] winLine;

    public GameBoard() {
        board = new int[SIZE][SIZE];
        reset();
    }

    public void reset() {
        for (int[] row : board) {
            java.util.Arrays.fill(row, EMPTY);
        }
        currentPlayer = BLACK;
        gameOver = false;
        winner = EMPTY;
        winLine = null;
    }

    /**
     * 在指定位置落子
     * @return true 如果落子成功
     */
    public boolean placeStone(int row, int col) {
        if (gameOver || row < 0 || row >= SIZE || col < 0 || col >= SIZE) {
            return false;
        }
        if (board[row][col] != EMPTY) {
            return false;
        }
        board[row][col] = currentPlayer;

        // 检查是否获胜
        if (checkWin(row, col)) {
            winner = currentPlayer;
            gameOver = true;
        } else {
            currentPlayer = (currentPlayer == BLACK) ? WHITE : BLACK;
        }
        return true;
    }

    private boolean checkWin(int row, int col) {
        int[][] directions = {{0, 1}, {1, 0}, {1, 1}, {1, -1}};
        int player = board[row][col];

        for (int[] dir : directions) {
            int dr = dir[0], dc = dir[1];
            int count = 1;
            int startRow = row, startCol = col;
            int endRow = row, endCol = col;

            // 正方向
            for (int i = 1; i < 5; i++) {
                int r = row + dr * i, c = col + dc * i;
                if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == player) {
                    count++;
                    endRow = r;
                    endCol = c;
                } else {
                    break;
                }
            }
            // 反方向
            for (int i = 1; i < 5; i++) {
                int r = row - dr * i, c = col - dc * i;
                if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == player) {
                    count++;
                    startRow = r;
                    startCol = c;
                } else {
                    break;
                }
            }

            if (count >= 5) {
                winLine = new int[][]{{startRow, startCol}, {endRow, endCol}};
                return true;
            }
        }
        return false;
    }

    public int getCell(int row, int col) {
        return board[row][col];
    }

    public int getCurrentPlayer() {
        return currentPlayer;
    }

    public boolean isGameOver() {
        return gameOver;
    }

    public int getWinner() {
        return winner;
    }

    public int[][] getWinLine() {
        return winLine;
    }
}
