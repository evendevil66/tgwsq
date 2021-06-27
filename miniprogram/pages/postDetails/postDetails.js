// miniprogram/pages/postDetails/postDetails.js
const app = getApp()
const db = wx.cloud.database()
const comments = db.collection('Comments') //评论表
const posts = db.collection('Posts') //帖子表
const users = db.collection('Users') //用户表
const notice = db.collection('Notice') //系统通知表

Page({

  /**
   * 页面的初始数据
   */
  data: {
    navbarData: {
      title: "帖子详情",
      show: 0,
      back:1
    },
    inputIsFocus:false,
    deleteIndex:-1,
    reportConfirm:[{ text: '确认举报', value: 1 }],
    deleteConfirm:[{ text: '确认删除', value: 1 }],
    showDelete:false,
    showReport:false,
    commentsItem:[],
    content:"",
    noCommnet:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let object=JSON.parse(options.str);
    this.setData({
      post:object
    })
    this.getComments(object.postId)
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
      height: (app.globalData.height) * 2 + 48
    })
    var that = this
    var i = 0 
    var setData = setInterval(function(){
      that.setData({
        commentsItem: that.data.commentsItem,
        noCommnet:that.data.commentsItem.length>0?false:true
      })
      i++;
      if(i>50){
        clearInterval(setData)
      }
    },100)



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

  getComments: function(postId){
    var that = this
    var commentsItem = []
    comments.orderBy("createTime","desc").where({
      postId:postId
    }).get({
      success:function(res){
        commentsItem = res.data
        for(let i=0;i<commentsItem.length;i++){
          let createTime = new Date(commentsItem[i].createTime);
          let time = (new Date() - createTime)/1000
          if(time<60){
            commentsItem[i].createTime="1分钟前"
          }else if(time<60*60){
            commentsItem[i].createTime= parseInt((time/60))+"分钟前"
          }else if(time<60*60*24){
            commentsItem[i].createTime= parseInt((time/60/60))+"小时前"
          }else if(time<60*60*24*30){
            commentsItem[i].createTime= parseInt((time/60/60/24))+"天前"
          }else{
            if(createTime.getFullYear() == new Date().getFullYear()){
              commentsItem[i].createTime= (createTime.getMonth()+1)+"月"+createTime.getDay()+"日";
            }else{
              commentsItem[i].createTime= createTime.getFullYear()+"年"+(createTime.getMonth()+1)+"月"+createTime.getDay()+"日";
            }
          }
          users.where({
            openid:commentsItem[i].openid
          }).get({
            success:function(res){
              commentsItem[i].profile = res.data[0].profile
              commentsItem[i].nickname = res.data[0].nickname
            }
          })
        }

        that.setData({
          commentsItem:commentsItem
        })
        console.log(commentsItem)
      }
    })
  },
  inputOnFocus:function(e){
    this.setData({
      inputIsFocus:true
    })
  },
  inputOnBlur:function(e){
    this.setData({
      content:e.detail.value
    })
    var that= this
    setTimeout(function(){
      that.setData({
        inputIsFocus:false
      })
      
    },500)

  },
  submit:function(e){
    var that = this;

    setTimeout(function(){
      if(that.data.content.trim().length==0){
        wx.showToast({
          title: '请填写评论',
          icon: 'error'
        })
      }else if(that.data.content.trim().length<2){
        wx.showToast({
          title: '至少2字哦',
          icon: 'error'
        })
      }else{
        comments.add({
          data:{
            openid:app.globalData.openid,
            postId:that.data.post.postId,
            content:that.data.content,
            createTime:new Date()
          },
          success:function(res){
            console.log(res)
            wx.showToast({
              title: '评论成功',
            })
            let contentTemp = that.data.content
            that.setData({
              content:""
            })
            let commentsItem = that.data.commentsItem
            let comment = {}
            comment.content = contentTemp;
            comment.openid = app.globalData.openid;
            comment.postId =  that.data.post.postId;
            comment.createTime = "刚刚"
            comment.profile = app.globalData.User[1]
            comment.nickname = app.globalData.User[2]
            //console.log(app.globalData.User)
            console.log(comment)
            commentsItem.unshift(comment)
  
            console.log(commentsItem)
            that.setData({
              commentsItem: commentsItem,
              noCommnet:false
            })
  
            console.log("this.commentsItem",that.data.commentsItem)
          }
        })
      }
    }, 200);

    if(app.globalData.openid.trim()!=this.data.post.openid){
      notice.where({
        postId:that.data.post.postId,
        openid:that.data.post.openid,
        isRead:false
      }).count({
        success:function(res){
          if(res.total > 0){
            console.log("相同类型通知仍有未读")
          }else{
            notice.add({
              data:{
                content:"您的帖子“"+that.data.post.content+"”被评论了，点击查看",
                createTime:new Date(),
                openid:that.data.post.openid,
                postId:that.data.post.postId,
                isRead:false
              },
              success:function(res){
                console.log(res)
              }
            })
          }
        }
      })
    }
    
  },
  deleteTap:function(e){
    this.setData({
      showDelete:true,
      commandId:e.currentTarget.dataset.postid,
      deleteIndex:e.currentTarget.dataset.index
    })
    console.log("删除",e.currentTarget.dataset.postid)
    this.setData({
      isTap:false
    })
  },
  reportTap:function(e){
    this.setData({
      showReport:true,
      commandId:e.currentTarget.dataset.postid
    })
    console.log("举报",e.currentTarget.dataset.postid)
    this.setData({
      isTap:false
    })
  },
  reportConfirm:function(e){
    this.setData({
      showReport:false
    })
    wx.showToast({
      title: '已举报'
    })
  },
  deleteConfirm:function(e){
    this.setData({
      showDelete:false,
    })
    this.deletePost(this.data.commandId)
    wx.showToast({
      title: '已删除'
    })
    setTimeout(function () {
      var pages = getCurrentPages();
      var prevPage = pages[pages.length - 2];
      prevPage.setData({
        reload: true,
      });
      wx.navigateBack({
        delta: 0,
      })
    }, 1500)
  },
    /**
   * 根据postId删除帖子
   * @param {string} postId 
   */
  deletePost:function(postId){
    console.log("进入deletePost",postId)
    posts.doc(postId).remove({
      success: function(res){
        console.log(res)
      }
    })
  },
    /**
   * 点击图片触发事件
   * @param {object}} e 
   * e.currentTarget.dataset.index 为帖子在posts中的所属下标
   * e.currentTarget.dataset.imageindex 为image在post中的所属下标
   */
  imgTap: function (e) {
    console.log(this.data);
    var url = this.data.post.images[e.currentTarget.dataset.imageindex];
    var urls = [];
    urls['urls'] = [];
    urls['urls'] = urls['urls'].concat(url);
    this.previewImage(url, this.data.post.images)


  },
  /**
   * 大图预览图片
   * @param {array} url 当前显示图片的http链接
   * @param {array} urls 需要预览的图片http链接列表
   */
  previewImage: function (url, urls) {
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: urls // 需要预览的图片http链接列表
    })
  },
})