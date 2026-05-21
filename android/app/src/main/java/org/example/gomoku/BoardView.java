package org.example.gomoku;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;

public class BoardView extends View {

    private static final int BOARD_SIZE = GameBoard.SIZE;
    private static final int BOARD_COLOR = Color.rgb(222, 184, 135);
    private static final int LINE_COLOR = Color.rgb(51, 51, 51);

    private float cellSize;
    private float padding;
    private float stoneRadius;

    private final Paint boardPaint = new Paint();
    private final Paint linePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint blackPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint whitePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint stoneOutlinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint winPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private GameBoard gameBoard;
    private GameMode gameMode = GameMode.PVP;
    private GomokuAI ai;
    private volatile boolean aiThinking;
    private StatusCallback statusCallback;

    public interface StatusCallback {
        void onStatusChanged(String status);
    }

    public BoardView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        boardPaint.setColor(BOARD_COLOR);
        linePaint.setColor(LINE_COLOR);
        linePaint.setStrokeWidth(2f);
        blackPaint.setColor(Color.BLACK);
        whitePaint.setColor(Color.WHITE);
        stoneOutlinePaint.setColor(LINE_COLOR);
        stoneOutlinePaint.setStyle(Paint.Style.STROKE);
        stoneOutlinePaint.setStrokeWidth(1.5f);
        winPaint.setColor(Color.RED);
        winPaint.setStrokeWidth(5f);
    }

    public void setGameBoard(GameBoard board) {
        this.gameBoard = board;
    }

    public void setGameMode(GameMode mode) {
        this.gameMode = mode;
        if (mode.isPVE()) {
            boolean random = (mode == GameMode.PVE_EASY);
            ai = new GomokuAI(mode.getAiDepth(), mode.getCandidateRange(), mode.getMaxCandidates(), random);
        } else {
            ai = null;
        }
    }

    public void resetAI() {
        aiThinking = false;
    }

    public void setStatusCallback(StatusCallback callback) {
        this.statusCallback = callback;
    }

    public void undo() {
        if (aiThinking || gameBoard == null) return;
        if (gameMode.isPVE()) {
            gameBoard.undoLastMove();
            gameBoard.undoLastMove();
        } else {
            gameBoard.undoLastMove();
        }
        invalidate();
        updateStatus();
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        float minDim = Math.min(w, h);
        padding = minDim * 0.05f;
        cellSize = (minDim - 2 * padding) / (BOARD_SIZE - 1);
        stoneRadius = cellSize * 0.42f;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (gameBoard == null) return;

        float boardSize = padding * 2 + cellSize * (BOARD_SIZE - 1);

        // 背景
        canvas.drawRect(0, 0, getWidth(), getHeight(), boardPaint);

        // 网格线
        for (int i = 0; i < BOARD_SIZE; i++) {
            float pos = padding + i * cellSize;
            canvas.drawLine(padding, pos, boardSize - padding, pos, linePaint);
            canvas.drawLine(pos, padding, pos, boardSize - padding, linePaint);
        }

        // 星位
        int[][] stars = {{3, 3}, {3, 11}, {7, 7}, {11, 3}, {11, 11}};
        for (int[] star : stars) {
            float x = padding + star[1] * cellSize;
            float y = padding + star[0] * cellSize;
            canvas.drawCircle(x, y, cellSize * 0.1f, blackPaint);
        }

        // 棋子
        for (int r = 0; r < BOARD_SIZE; r++) {
            for (int c = 0; c < BOARD_SIZE; c++) {
                int cell = gameBoard.getCell(r, c);
                if (cell == GameBoard.EMPTY) continue;
                float x = padding + c * cellSize;
                float y = padding + r * cellSize;
                Paint stone = (cell == GameBoard.BLACK) ? blackPaint : whitePaint;
                canvas.drawCircle(x, y, stoneRadius, stone);
                canvas.drawCircle(x, y, stoneRadius, stoneOutlinePaint);
            }
        }

        // 获胜连线
        int[][] winLine = gameBoard.getWinLine();
        if (winLine != null) {
            float x1 = padding + winLine[0][1] * cellSize;
            float y1 = padding + winLine[0][0] * cellSize;
            float x2 = padding + winLine[1][1] * cellSize;
            float y2 = padding + winLine[1][0] * cellSize;
            canvas.drawLine(x1, y1, x2, y2, winPaint);
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (event.getAction() != MotionEvent.ACTION_DOWN) return false;
        if (gameBoard == null || gameBoard.isGameOver() || aiThinking) return false;

        float x = event.getX();
        float y = event.getY();
        int col = Math.round((x - padding) / cellSize);
        int row = Math.round((y - padding) / cellSize);

        if (gameBoard.placeStone(row, col)) {
            invalidate();
            updateStatus();
            if (gameMode.isPVE() && !gameBoard.isGameOver()) {
                triggerAIMove();
            }
        }
        return true;
    }

    private void triggerAIMove() {
        aiThinking = true;
        if (statusCallback != null) statusCallback.onStatusChanged("AI正在思考...");

        new Thread(() -> {
            int[][] snapshot = gameBoard.getBoardCopy();
            int[] move = ai.findBestMove(snapshot);
            post(() -> {
                if (move != null && !gameBoard.isGameOver()) {
                    gameBoard.placeStone(move[0], move[1]);
                    invalidate();
                    updateStatus();
                }
                aiThinking = false;
            });
        }).start();
    }

    private void updateStatus() {
        if (statusCallback == null) return;
        if (gameBoard.isGameOver()) {
            String winner = gameBoard.getWinner() == GameBoard.BLACK ? "黑子" : "白子";
            statusCallback.onStatusChanged("游戏结束！" + winner + "获胜！");
        } else {
            String player = gameBoard.getCurrentPlayer() == GameBoard.BLACK ? "黑子" : "白子";
            statusCallback.onStatusChanged("当前回合：" + player);
        }
    }
}
