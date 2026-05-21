import { GameMain } from './gameMain.js'

const info = wx.getSystemInfoSync()
const dpr = info.pixelRatio
const screenW = info.windowWidth
const screenH = info.windowHeight

const canvas = wx.createCanvas()
canvas.width = screenW * dpr
canvas.height = screenH * dpr

const main = new GameMain(canvas, screenW, screenH, dpr)
main.start()
