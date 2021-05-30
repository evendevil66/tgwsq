// pages/userConsole/userConsole.js
const app = getApp()
const openid = "0"
const db = wx.cloud.database()
const notice = db.collection('Notice') //系统通知表
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
    noRead:false

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

    var that = this
    notice.where({
      openid:app.globalData.openid,
      isRead:false
    }).count({
      success:function(res){

        console.log(res.total)
        if(res.total > 0){
          that.setData({
            noRead:true
          })
        }else{
          that.setData({
            noRead:false
          })
        }
      }
    })
  },
  noticeTap:function(){
    wx.navigateTo({
      url: "../notice/notice"
    })
  }
})