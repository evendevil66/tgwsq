const app = getApp()
Component({
  properties: {
    navbarData:{
      type:Object,
      value:{
        title:""
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
        url: '/pages/mine/mine',//发帖的地址
      })
    }
  }
 
}) 