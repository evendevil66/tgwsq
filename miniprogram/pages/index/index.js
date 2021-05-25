//index.js
const app = getApp()
const db = wx.cloud.database()
const users = db.collection('Users') //用户表
const posts = db.collection('Posts') //帖子表
const sorts = db.collection('Sorts') //分类表
const praises = db.collection('Praises') //点赞表
const comments = db.collection('Comments') //评论表

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    hasUserInfo: false,
    logged: false,
    takeSession: false,
    requestResult: '',
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl'), // 如需尝试获取用户信息可改为false,
    navbarData: {
      title: "太原工业微社区",
      show: 1
    },
    items: ['推荐','二手闲置','悬赏问答','寻人问答','校园拼车','学术讨论'],
    itemsId:['0','28ee4e3e60a8f1cd1b3e979c5d52fb5b','79550af260a8f1fb191133532d1fefa3','79550af260a8f20a191138eb23345fed','b00064a760a8f21619b9b0e80337e6f1','cbddf0af60a8f2200a8e8f6f35e85c79'],
    User:[],
    Posts:[],
    reload:false,
    itemsIndex:"0",
    page:0,
    showDelete:false,
    showReport:false,
    commandId:'0',
    deleteIndex:-1,
    reportConfirm:[{ text: '确认举报', value: 1 }],
    deleteConfirm:[{ text: '确认删除', value: 1 }],
  },
  /**
   * 获取帖子信息
   */
  getPosts:function(){
    var that = this;//.limit((page*10-9),page*10)
    posts.orderBy("createTime","desc").skip(that.data.page*10).limit(10).where({
      sortId:this.data.itemsIndex=="0"?{$regex:'.*'}:that.data.itemsIndex
    }).get({
      success:function(res){
        for(let i=0;i<res.data.length;i++){
          let post = {
            openid:"", //1
            nickname:"", //1
            profile:"", //1
            createTime:"",//1
            sortName:"",//1
            content:"", //1
            images:[], //1
            praisesCount:0,//1
            commentsCount:0,//1
            isPraise:false,//1
            isMe:false, //1,
            postId:""//1
          }
          let createTime = new Date(res.data[i].createTime);
          let time = (new Date() - createTime)/1000
          
          if(time<60){
            post.createTime="1分钟前"
          }else if(time<60*60){
            post.createTime= parseInt((time/60))+"分钟前"
          }else if(time<60*60*24){
            post.createTime= parseInt((time/60/60))+"小时前"
          }else if(time<60*60*24*30){
            post.createTime= parseInt((time/60/60/24))+"天前"
          }else{
            if(createTime.getFullYear() == new Date().getFullYear()){
              post.createTime= (createTime.getMonth()+1)+"月"+createTime.getDay()+"日";
            }else{
              post.createTime= createTime.getFullYear()+"年"+(createTime.getMonth()+1)+"月"+createTime.getDay()+"日";
            }
            
          }

          //填入发帖内容到post
          post.content=res.data[i].content;
          post.postId=res.data[i]._id;

          //通过云开发函数换取图片临时访问地址
          wx.cloud.getTempFileURL({
            fileList: res.data[i].images,
            success: res => {
              for(let j=0;j<res.fileList.length;j++)
              post.images.push(res.fileList[j].tempFileURL)//填入帖子图片url到post
            },
          })

          //获取并填入发帖人openid、昵称、头像，判断发帖人与用户是否为同一人填入isMe
          users.where({
            _openid:res.data[i].openid
          }).get({
            success:function(res){
              post.openid=res.data[0].openid
              post.nickname=res.data[0].nickname
              post.profile=res.data[0].profile
              if(post.openid == app.globalData.openid){
                post.isMe=true;
              }
            }
          })
          
          //获取帖子分类对应名称
          sorts.where({
            _id:res.data[i].sortId
          }).get({
            success:function(res){
              post.sortName=res.data[0].name
            }
          })

          //获取评论数量
          comments.where({
            postId:res.data[i]._id
          }).count({
            success:function(res){
              post.commentsCount=res.total
            }
          })

          //获取点赞数量
          praises.where({
            postid:res.data[i]._id
          }).count({
            success:function(res){
              post.praisesCount=res.total
            }
          })

          //获取是否已点赞
          praises.where({
            postid:res.data[i]._id,
            openid:app.globalData.openid
          }).count({
            success:function(res){
              if(res.total>0){
                post.isPraise=true
              }
            }
          })

          var Posts = that.data.Posts;
          Posts.push(post);
          that.setData({
            Posts:Posts
          })
        }
      }
    })
  },
  /**
   * 获取登陆用户信息
   */
  getUser:function() {
    var that = this;
    var user=[];
    if(this.data.User.length==0){
      console.log("未获取用户信息,尝试数据库获取");
      setTimeout(function(){
        console.log("延迟500结束",app.globalData.openid);
        users.where({
          _openid:app.globalData.openid
        }).get({
          success:function(res){
            if(res.data.length==0){
              console.log("数据库中不包含用户信息，跳转授权页")
              wx.navigateTo({
                url: '/pages/login/login?status=-1',
              })
            }else if(new Date()-res.data[0].updateTime > 1296000000){
              console.log("用户授权已超过15天，跳转授权页")
              wx.navigateTo({
                url: '/pages/login/login?status=0',
              })
            }else{
              console.log("已授权，将各项信息存入data")
              user[0] = res.data[0].openid
              user[1] = res.data[0].profile
              user[2] = res.data[0].nickname
              that.setData({
                User:user
              })
              app.globalData.User=user;
              console.log(user)
            }
            
          }
        })
      },500)
    }
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
  onLoad() {
    wx.cloud.init({
        env: 'moment-7gyx9ooq74b057e1'
    }),
    this.setData({
        search: this.search.bind(this)
    })
    //this.getItem();
    this.getUser();
    this.getPosts();
    
  },
  onShow(){
    console.log("进入主页onshow函数")
    if(this.data.reload){
      this.setData({
        reload:false
      })
      this.setData({
        Posts:[]
      })
      this.getPosts();
    }
    
    var i = 0
    var load = setInterval(() => {
      this.setData({
        Posts:this.data.Posts
      })
      if(this.data.Posts.length>10 || i>100){
        clearInterval(load);
      }
      i++;
    }, 50)
  },
  onItemtap :function(event){
    var that = this
    if(event.detail.trim() == this.data.itemsIndex){
      console.log("选择未发生变化：",event.detail)
    }else{
      that.setData({
        itemsIndex:event.detail.trim(),
        page:0,
        reload:true
      })
      this.onShow();
      console.log("选择发生变化：",event.detail)
    }
  },
  search: function (value) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (value != "") {
          
          resolve([{
            text: value + "是什么",
            value: 1
          }, {
            text: value + "在哪",
            value: 2
          }])
        } else {
          resolve([]);
        }
      }, 1)
    })
  },
  selectResult: function (e) {
    console.log('select result', e.detail)
  },
  praiseTap:function(e){
    let index = e.currentTarget.dataset.index;
    var Posts = this.data.Posts
    if(Posts[index].isPraise){
      Posts[index].isPraise = false
      Posts[index].praisesCount--;
      praises.where({
        postid:Posts[index].postId,
        openid:app.globalData.openid
      }).remove({
        success: function(res) {
          console.log(res)
        }
      })
    }else{
      Posts[index].isPraise = true
      Posts[index].praisesCount++;
      praises.add({
        data:{
          postid:Posts[index].postId,
          openid:app.globalData.openid
        },
        success:function(res){
          console.log(res)
        }
      })
    }
    this.setData({
      Posts:Posts
    })

  },
  imgTap: function (e) {
    /**console.log(e.currentTarget.dataset.src)
    var urls=[];
    urls['urls'] = [];
    urls['urls']=urls['urls'].concat("./"+e.currentTarget.dataset.src)
    this.previewImage("./"+e.currentTarget.dataset.src,urls['urls'])
    console.log(urls['urls']);**/
    
    var url = this.data.Posts[e.currentTarget.dataset.index].images[e.currentTarget.dataset.imageindex];
    var urls = [];
    urls['urls'] = [];
    urls['urls'] = urls['urls'].concat(url);
    this.previewImage(url, this.data.Posts[e.currentTarget.dataset.index].images)
    

  },
  previewImage: function (url, urls) {
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: urls // 需要预览的图片http链接列表
    })
  },
  deleteTap:function(e){
    this.setData({
      showDelete:true,
      commandId:e.currentTarget.dataset.postid,
      deleteIndex:e.currentTarget.dataset.index
    })
    console.log("删除",e.currentTarget.dataset.postid)
  },
  reportTap:function(e){
    this.setData({
      showReport:true,
      commandId:e.currentTarget.dataset.postid
    })
    console.log("举报",e.currentTarget.dataset.postid)
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
    var Posts = this.data.Posts
    Posts.splice(this.data.deleteIndex,1)
    this.setData({
      showDelete:false,
      Posts:Posts
    })
    this.deletePost(this.data.commandId)
    wx.showToast({
      title: '已删除'
    })
  },
  onGetOpenid: function () {
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