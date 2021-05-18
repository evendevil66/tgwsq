// pages/userConsole/userConsole.js
const app = getApp()
const openid="0"
Page({

  data: {
    openid: ''
  },



  onLoad: function (options) {
    this.setData({
      openid: app.globalData.openid
    })
  }
})
