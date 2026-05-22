var GameMain = require('./gameMain.js').GameMain

var info = wx.getSystemInfoSync()
var dpr = info.pixelRatio
var screenW = info.windowWidth
var screenH = info.windowHeight

var canvas = wx.createCanvas()
canvas.width = screenW * dpr
canvas.height = screenH * dpr

var main = new GameMain(canvas, screenW, screenH, dpr)
main.start()

wx.onAppShow(function() {
  main.page = 'welcome'
  main.board.reset()
  main.thinking = false
  main.status = '当前回合：黑子'
  main.stopTimer()
  main.paint()
})
