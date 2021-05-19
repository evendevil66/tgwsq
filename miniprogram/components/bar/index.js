const app = getApp()

wx.cloud.callFunction({
  name: 'login',
  data: {},
  success: res => {
    console.log('[云函数] [login] user openid: ', res.result.openid)
    app.globalData.openid = res.result.openid
  },
  fail: err => {
    console.error('[云函数] [login] 调用失败', err)
  }
})

Component({
  properties: {
    navbarData:{
      type:Object,
      value:{
        title:"",
        show:false,
        back:false
      }
    },
  },
  
  data: {
    height: '',
    //默认值  默认显示左上角
    navbarData: {
      showCapsule: 1
    }
  },
  onLoad: function() {
    console.log("进入bar，"+height);
  },
  attached: function () {
    // 获取是否是通过分享进入的小程序
    this.setData({
      share: app.globalData.share
    })
    // 定义导航栏的高度   方便对齐
    this.setData({
      height: app.globalData.height
    })
  },
  methods: {
  // 发帖
    _navnew() {
      wx.navigateTo({
        url: '/pages/post/post',//发帖的地址
      })
    },
    _navback(){
      wx.navigateBack({
        delta: 1
      })      
  },
  }
 
}) 