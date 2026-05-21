var GameMain = require('./gameMain.js').GameMain

var info = wx.getSystemInfoSync()
var screenW = info.windowWidth
var screenH = info.windowHeight

var canvas = wx.createCanvas()
canvas.width = screenW
canvas.height = screenH

var main = new GameMain(canvas, screenW, screenH)
main.start()
