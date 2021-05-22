//index.js
const app = getApp()

Page({
    onLoad() {
      wx.cloud.init({
        env: 'moment-7gyx9ooq74b057e1'
      }),
        this.setData({
            search: this.search.bind(this)
        })
    },
    search: function (value) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
              if(value!=""){
                console.log('111')
                resolve([{text: value+"是什么", value: 1}, {text: value+"在哪", value: 2}])
              }else{
                console.log('000')
                resolve([]);
              }
            }, 1)
        })
    },
    selectResult: function (e) {
        console.log('select result', e.detail)
    },

  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    hasUserInfo: false,
    logged: false,
    takeSession: false,
    requestResult: '',
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl'), // 如需尝试获取用户信息可改为false,
    navbarData:{
      title: "太原工业微社区",
      show:1
    },
    items:['推荐','二手闲置','悬赏问答','寻人问答','校园拼车','学术讨论'],
  },

  imgTap:function(e){
      /**console.log(e.currentTarget.dataset.src)
      var urls=[];
      urls['urls'] = [];
      urls['urls']=urls['urls'].concat("./"+e.currentTarget.dataset.src)
      this.previewImage("./"+e.currentTarget.dataset.src,urls['urls'])
      console.log(urls['urls']);**/
      var url="https://6d6f-moment-7gyx9ooq74b057e1-1305621815.tcb.qcloud.la/uploadImg/1621668378646182.jpg";
      var urls=[];
      urls['urls'] = [];
      urls['urls']=urls['urls'].concat(url);
      this.previewImage(url,urls['urls'])
      
  },

  previewImage: function (url,urls) {
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: urls // 需要预览的图片http链接列表
    })
  },



  getUserProfile() {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        this.setData({
          avatarUrl: res.userInfo.avatarUrl,
          userInfo: res.userInfo,
          hasUserInfo: true,
        })
      }
    })
  },

  onGetUserInfo: function(e) {
    if (!this.data.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo,
        hasUserInfo: true,
      })
    }
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

})
