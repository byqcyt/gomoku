package org.example.gomoku;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.TextView;

public class MainActivity extends Activity {

    private GameBoard gameBoard;
    private BoardView boardView;
    private TextView statusText;

    private static final GameMode[] MODES = {
        GameMode.PVP, GameMode.PVE_HARD, GameMode.PVE_MEDIUM, GameMode.PVE_EASY
    };
    private static final String[] MODE_NAMES = {
        "人人对战", "高级人机", "中级人机", "普通人机"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        gameBoard = new GameBoard();

        boardView = findViewById(R.id.boardView);
        statusText = findViewById(R.id.statusText);
        Spinner modeSpinner = findViewById(R.id.modeSpinner);
        Button undoBtn = findViewById(R.id.undoBtn);
        Button resetBtn = findViewById(R.id.resetBtn);

        boardView.setGameBoard(gameBoard);
        boardView.setGameMode(MODES[0]);
        boardView.setStatusCallback(status -> statusText.setText(status));

        ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
            android.R.layout.simple_spinner_item, MODE_NAMES);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        modeSpinner.setAdapter(adapter);
        modeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                boardView.setGameMode(MODES[position]);
                resetGame();
            }
            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        undoBtn.setOnClickListener(v -> boardView.undo());

        resetBtn.setOnClickListener(v -> resetGame());
    }

    private void resetGame() {
        gameBoard.reset();
        boardView.resetAI();
        boardView.invalidate();
        statusText.setText("当前回合：黑子");
    }
}
