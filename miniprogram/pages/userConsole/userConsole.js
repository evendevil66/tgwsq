// pages/userConsole/userConsole.js
const app = getApp()
const openid = "0"
Page({

  data: {
    openid: '',
    nickname: '',
    profile: '',
    navbarData: {
      title: "个人中心",
      show: 0,
      back: 0
    },

  },

  onLoad: function (options) {

  },

  onShow: function (options) {
    var that = this;
    var count = 0;
    var load = setInterval(function () {
      if (count > 50 || typeof (app.globalData.User[2]) != "undefined") {
        that.setData({
          openid: app.globalData.openid,
          profile: app.globalData.User[1],
          nickname: app.globalData.User[2],
          height: (app.globalData.height) * 2
        })
        count++;
        clearInterval(load)
      }
    }, 100)
  }
})