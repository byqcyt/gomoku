var GameMain = require('./gameMain.js').GameMain

var info = wx.getSystemInfoSync()
var dpr = info.pixelRatio
var screenW = info.windowWidth
var screenH = info.windowHeight

var canvas = wx.createCanvas({ type: '2d' })
canvas.width = screenW * dpr
canvas.height = screenH * dpr

var main = new GameMain(canvas, screenW, screenH, dpr)
main.start()
