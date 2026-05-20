package org.example.gomoku;

import javax.swing.*;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

/**
 * 五子棋棋盘绘制面板
 */
public class GomokuPanel extends JPanel {

    private static final int CELL_SIZE = 40;
    private static final int PADDING = 30;
    private static final int STONE_RADIUS = 16;
    private static final Color BOARD_COLOR = new Color(222, 184, 135);
    private static final Color LINE_COLOR = new Color(51, 51, 51);

    private final GameBoard gameBoard;
    private final JLabel statusBar;
    private GameMode gameMode = GameMode.PVP;
    private GomokuAI ai;
    private volatile boolean aiThinking;

    public GomokuPanel(GameBoard gameBoard, JLabel statusBar) {
        this.gameBoard = gameBoard;
        this.statusBar = statusBar;

        int boardPixelSize = PADDING * 2 + CELL_SIZE * (GameBoard.SIZE - 1);
        setPreferredSize(new Dimension(boardPixelSize, boardPixelSize));

        addMouseListener(new MouseAdapter() {
            @Override
            public void mousePressed(MouseEvent e) {
                if (gameBoard.isGameOver() || aiThinking) {
                    return;
                }
                int col = Math.round((float) (e.getX() - PADDING) / CELL_SIZE);
                int row = Math.round((float) (e.getY() - PADDING) / CELL_SIZE);

                if (gameBoard.placeStone(row, col)) {
                    repaint();
                    updateStatus();
                    if (gameMode == GameMode.PVE && !gameBoard.isGameOver()) {
                        triggerAIMove();
                    }
                }
            }
        });
    }

    public void setGameMode(GameMode mode) {
        this.gameMode = mode;
        if (mode == GameMode.PVE && ai == null) {
            ai = new GomokuAI(3);
        }
    }

    public void resetAI() {
        aiThinking = false;
    }

    private void triggerAIMove() {
        aiThinking = true;
        statusBar.setText("AI正在思考...");

        int[][] snapshot = gameBoard.getBoardCopy();
        new SwingWorker<int[], Void>() {
            @Override
            protected int[] doInBackground() {
                return ai.findBestMove(snapshot);
            }

            @Override
            protected void done() {
                try {
                    int[] move = get();
                    if (move != null && !gameBoard.isGameOver()) {
                        gameBoard.placeStone(move[0], move[1]);
                        repaint();
                        updateStatus();
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                } finally {
                    aiThinking = false;
                }
            }
        }.execute();
    }

    private void updateStatus() {
        if (gameBoard.isGameOver()) {
            String winnerName = gameBoard.getWinner() == GameBoard.BLACK ? "黑子" : "白子";
            statusBar.setText("游戏结束！" + winnerName + "获胜！点击「重新开始」开始新游戏");
        } else {
            String player = gameBoard.getCurrentPlayer() == GameBoard.BLACK ? "黑子" : "白子";
            statusBar.setText("当前回合：" + player + "，请点击棋盘落子");
        }
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        int boardPixelSize = PADDING * 2 + CELL_SIZE * (GameBoard.SIZE - 1);

        // 绘制棋盘背景
        g2.setColor(BOARD_COLOR);
        g2.fillRect(0, 0, getWidth(), getHeight());

        // 绘制网格线
        g2.setColor(LINE_COLOR);
        g2.setStroke(new BasicStroke(1f));
        for (int i = 0; i < GameBoard.SIZE; i++) {
            int pos = PADDING + i * CELL_SIZE;
            g2.drawLine(PADDING, pos, boardPixelSize - PADDING, pos);
            g2.drawLine(pos, PADDING, pos, boardPixelSize - PADDING);
        }

        // 绘制星位
        int[][] stars = {{3, 3}, {3, 11}, {7, 7}, {11, 3}, {11, 11}};
        for (int[] star : stars) {
            int x = PADDING + star[1] * CELL_SIZE;
            int y = PADDING + star[0] * CELL_SIZE;
            g2.fillOval(x - 4, y - 4, 8, 8);
        }

        // 绘制棋子
        for (int r = 0; r < GameBoard.SIZE; r++) {
            for (int c = 0; c < GameBoard.SIZE; c++) {
                int cell = gameBoard.getCell(r, c);
                if (cell == GameBoard.EMPTY) {
                    continue;
                }
                int x = PADDING + c * CELL_SIZE;
                int y = PADDING + r * CELL_SIZE;

                if (cell == GameBoard.BLACK) {
                    g2.setColor(Color.BLACK);
                } else {
                    g2.setColor(Color.WHITE);
                }
                g2.fillOval(x - STONE_RADIUS, y - STONE_RADIUS, STONE_RADIUS * 2, STONE_RADIUS * 2);
                g2.setColor(LINE_COLOR);
                g2.setStroke(new BasicStroke(1f));
                g2.drawOval(x - STONE_RADIUS, y - STONE_RADIUS, STONE_RADIUS * 2, STONE_RADIUS * 2);
            }
        }

        // 绘制获胜连线
        int[][] winLine = gameBoard.getWinLine();
        if (winLine != null) {
            g2.setColor(Color.RED);
            g2.setStroke(new BasicStroke(3f));
            int x1 = PADDING + winLine[0][1] * CELL_SIZE;
            int y1 = PADDING + winLine[0][0] * CELL_SIZE;
            int x2 = PADDING + winLine[1][1] * CELL_SIZE;
            int y2 = PADDING + winLine[1][0] * CELL_SIZE;
            g2.drawLine(x1, y1, x2, y2);
        }
    }
}
