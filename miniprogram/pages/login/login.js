// pages/login/login.js
const app = getApp()
const db = wx.cloud.database()
const users = db.collection('Users')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    navbarData: {
      title: "太工微社区授权页",
      show: 0
    },
    User:[],
  },
  getUserProfile() {
    var that = this;
    wx.getUserProfile({
      desc: '获取用户的昵称和头像', 
      success: (res) => {
        console.log(res.userInfo)
        console.log(app.globalData.openid)
        if(that.data.status==-1){
          console.log("用户信息不存在，新增到数据库")
          users.add({
            data:{
              openid:app.globalData.openid,
              nickname:res.userInfo.nickName,
              profile:res.userInfo.avatarUrl,
              updateTime:new Date()
            },
            success:function(res){
              console.log(res)
            }
          })
        }else{
          console.log("用户信息存在，更新最新昵称和头像")
          users.where({
            openid:app.globalData.openid
          }).update({
            data:{
              nickname:res.userInfo.nickName,
              profile:res.userInfo.avatarUrl,
              updateTime:new Date()
            },
            success:function(res){
              console.log(res.data)
            }
          }) 
        }
        var user = []
        user[0] = app.globalData.openid;
        user[1] = res.userInfo.avatarUrl;
        user[2] = res.userInfo.nickName;
        this.setData({
          User: user,
        })
        var pages = getCurrentPages();
        var prevPage = pages[pages.length - 2];
        prevPage.setData({
          User:user,
          loginStatus:1
        });
        app.globalData.User = user;

        wx.navigateBack({
          delta: 0,
        })
      }
    })
  },
  return:function(){
    wx.navigateBack({
      delta: 0,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (option) {
    console.log("status",option.status)
    this.setData({
      status:option.status
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})