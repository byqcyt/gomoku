package org.example.gomoku;

import javax.swing.*;
import java.awt.*;

/**
 * 五子棋 - 启动入口
 */
public class GomokuApp {

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("五子棋");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setResizable(false);

            GameBoard gameBoard = new GameBoard();

            JLabel statusBar = new JLabel("当前回合：黑子，请点击棋盘落子");
            statusBar.setFont(new Font("微软雅黑", Font.PLAIN, 14));
            statusBar.setBorder(BorderFactory.createEmptyBorder(6, 10, 6, 10));

            GomokuPanel panel = new GomokuPanel(gameBoard, statusBar);

            JButton resetBtn = new JButton("重新开始");
            resetBtn.setFont(new Font("微软雅黑", Font.PLAIN, 14));
            resetBtn.addActionListener(e -> {
                gameBoard.reset();
                panel.repaint();
                statusBar.setText("当前回合：黑子，请点击棋盘落子");
            });

            JPanel bottomPanel = new JPanel(new BorderLayout());
            bottomPanel.add(statusBar, BorderLayout.CENTER);
            bottomPanel.add(resetBtn, BorderLayout.EAST);

            frame.add(panel, BorderLayout.CENTER);
            frame.add(bottomPanel, BorderLayout.SOUTH);
            frame.pack();
            frame.setLocationRelativeTo(null);
            frame.setVisible(true);
        });
    }
}
