const app = getApp()
const db = wx.cloud.database()
const notice = db.collection('Notice') //系统通知表
const users = db.collection('Users') //用户表
const posts = db.collection('Posts') //帖子表
const sorts = db.collection('Sorts') //分类表
Page({

  /**
   * 页面的初始数据
   */
  data: {
    navbarData: {
      title: "系统通知",
      show: 0,
      back: 1
    },
    noRead: true,
    notices: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
    this.setData({
      height: (app.globalData.height) * 2
    })

    this.setData({
      notices: []
    })

    var that = this
    notice.orderBy("createTime", "desc").where({
      openid: app.globalData.openid,
    }).get({
      success: function (res) {
        var notices = that.data.notices
        for (let i = 0; i < res.data.length; i++) {
          var notice = {}
          notice.content = res.data[i].content
          notice.postId = res.data[i].postId
          notice.isRead = res.data[i].isRead
          notices.push(notice)
        }
        that.setData({
          notices: notices
        })
      }
    })

    setTimeout(function () {
      notice.where({
        openid: app.globalData.openid
      }).update({
        data: {
          isRead: true
        },
        success: function (res) {
          console.log(res)
        }

      })
    }, 1000)

  },

  itemTap: function (e) {
    let postId = e.currentTarget.dataset.postid
    var that = this;
    posts.doc(postId).get({
      success: function (res) {
        console.log(res.data)
        
        var post = {
          openid: "", //1
          nickname: "", //1
          profile: "", //1
          createTime: "", //1
          sortName: "", //1
          content: "", //1
          images: [], //1
          praisesCount: 0, //1
          commentsCount: 0, //1
          isPraise: false, //1
          isMe: false, //1,
          postId: "" //1
        }

        let createTime = new Date(res.data.createTime);
        let time = (new Date() - createTime) / 1000

        if (time < 60) {
          post.createTime = "1分钟前"
        } else if (time < 60 * 60) {
          post.createTime = parseInt((time / 60)) + "分钟前"
        } else if (time < 60 * 60 * 24) {
          post.createTime = parseInt((time / 60 / 60)) + "小时前"
        } else if (time < 60 * 60 * 24 * 30) {
          post.createTime = parseInt((time / 60 / 60 / 24)) + "天前"
        } else {
          if (createTime.getFullYear() == new Date().getFullYear()) {
            post.createTime = (createTime.getMonth() + 1) + "月" + createTime.getDay() + "日";
          } else {
            post.createTime = createTime.getFullYear() + "年" + (createTime.getMonth() + 1) + "月" + createTime.getDay() + "日";
          }

        }

        //填入发帖内容到post
        post.content = res.data.content;
        post.postId = res.data._id;

        //通过云开发函数换取图片临时访问地址
        wx.cloud.getTempFileURL({
          fileList: res.data.images,
          success: res => {
            for (let j = 0; j < res.fileList.length; j++)
              post.images.push(res.fileList[j].tempFileURL) //填入帖子图片url到post
          },
        })

        //填入发帖人(本人)openid、昵称、头像
            post.openid = app.globalData.openid
            post.nickname = app.globalData.User[2]
            post.profile = app.globalData.User[1]
            post.isMe = true;

        //获取帖子分类对应名称
        sorts.where({
          _id: res.data.sortId
        }).get({
          success: function (res) {
            post.sortName = res.data.name
          }
        })

        console.log(post)
        wx.showToast({
          icon:'loading',
          title: '正在加载'
        })
        setTimeout(function(){
          let str = JSON.stringify(post)
          console.log(str)
          wx.navigateTo({
            url: "../postDetails/postDetails?str=" + str
          })
        },500)
        

      }
    })
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