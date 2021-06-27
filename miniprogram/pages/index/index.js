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
    }, //绑定顶栏内容，title为标题，show为1时显示发帖按钮，back为1时显示返回按钮
    items: ['推荐', '学术讨论', '二手闲置', '悬赏问答', '寻人问答', '校园拼车'],
    itemsId: ['0', 'cbddf0af60a8f2200a8e8f6f35e85c79', '28ee4e3e60a8f1cd1b3e979c5d52fb5b', '79550af260a8f1fb191133532d1fefa3', '79550af260a8f20a191138eb23345fed', 'b00064a760a8f21619b9b0e80337e6f1'],
    User: [], //当前用户信息
    Posts: [], //绑定主页帖子信息
    reload: false, //用于onShow函数判断是否需要重新加载
    itemsIndex: "0", //当前页面的分类id，推荐页面为0
    page: 0, //分页查询
    showDelete: false, //绑定举报提示弹窗，点击举报按钮后变更为true
    showReport: false, //绑定删除提示弹窗，点击删除按钮后变更为true
    commandId: '0', //进行删除和举报操作时，存储操作的postid
    deleteIndex: -1, //点击删除帖子后获得该条帖子在Posts中的下标
    reportConfirm: [{
      text: '确认举报',
      value: 1
    }], //点击举报按钮后的弹窗内容
    deleteConfirm: [{
      text: '确认删除',
      value: 1
    }], //点击删除按钮后的弹窗内容
    isTap: true, //判断是否点击了帖子内的按钮，如点击了按钮则返回false
    PostsTemp: [], //搜索帖子时，将完整内容临时存储
    searchValue: "", //绑定搜索框Value
    searchOn: false, //判断目前处于搜索状态
    loginStatus: -1, //判断是否为登陆状态，-1为未登录，0为登陆过期，1为已登陆
  },
  /**
   * 获取帖子信息
   */
  getPosts: function () {
    var that = this;
    var flag = setInterval(function () {
      if (typeof (app.globalData.openid) == "undefined") {

      } else {

         //.limit((page*10-9),page*10)
        posts.orderBy("createTime", "desc").skip(that.data.page * 10).limit(10).where({
          sortId: that.data.itemsIndex == "0" ? {
            $regex: '.*'
          } : that.data.itemsIndex
        }).get({
          success: function (res) {
            for (let i = 0; i < res.data.length; i++) {
              let post = {
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
              let createTime = new Date(res.data[i].createTime);
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
              post.content = res.data[i].content;
              post.postId = res.data[i]._id;

              //通过云开发函数换取图片临时访问地址
              wx.cloud.getTempFileURL({
                fileList: res.data[i].images,
                success: res => {
                  for (let j = 0; j < res.fileList.length; j++)
                    post.images.push(res.fileList[j].tempFileURL) //填入帖子图片url到post
                },
              })

              //获取并填入发帖人openid、昵称、头像，判断发帖人与用户是否为同一人填入isMe
              users.where({
                _openid: res.data[i].openid
              }).get({
                success: function (res) {
                  post.openid = res.data[0].openid
                  post.nickname = res.data[0].nickname
                  post.profile = res.data[0].profile
                  if (post.openid == app.globalData.openid) {
                    post.isMe = true;
                  }
                }
              })

              //获取帖子分类对应名称
              sorts.where({
                _id: res.data[i].sortId
              }).get({
                success: function (res) {
                  post.sortName = res.data[0].name
                }
              })

              //获取评论数量
              comments.where({
                postId: res.data[i]._id
              }).count({
                success: function (res) {
                  post.commentsCount = res.total
                }
              })

              //获取点赞数量
              praises.where({
                postid: res.data[i]._id
              }).count({
                success: function (res) {
                  post.praisesCount = res.total
                }
              })

              //获取是否已点赞
                praises.where({
                  postid: res.data[i]._id,
                  openid: app.globalData.openid
                }).count({
                  success: function (res) {
                    if (res.total > 0) {
                      post.isPraise = true
                    }
                  }
                })

              var Posts = that.data.Posts;
              Posts.push(post);
              that.setData({
                Posts: Posts
              })



            }
          }
        })
        clearInterval(flag)
      }

    }, 100);

  },
  /**
   * 通过帖子内容模糊获取帖子信息
   */
  getPostsByContent: function (content) {
    var that = this;
    posts.orderBy("createTime", "desc").where({
      content: {
        $regex: '.*' + content,
        $options: 'i'
      }
    }).get({
      success: function (res) {
        for (let i = 0; i < res.data.length; i++) {
          let post = {
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
          let createTime = new Date(res.data[i].createTime);
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
          post.content = res.data[i].content;
          post.postId = res.data[i]._id;

          //通过云开发函数换取图片临时访问地址
          wx.cloud.getTempFileURL({
            fileList: res.data[i].images,
            success: res => {
              for (let j = 0; j < res.fileList.length; j++)
                post.images.push(res.fileList[j].tempFileURL) //填入帖子图片url到post
            },
          })

          //获取并填入发帖人openid、昵称、头像，判断发帖人与用户是否为同一人填入isMe
          users.where({
            _openid: res.data[i].openid
          }).get({
            success: function (res) {
              post.openid = res.data[0].openid
              post.nickname = res.data[0].nickname
              post.profile = res.data[0].profile
              if (post.openid == app.globalData.openid) {
                post.isMe = true;
              }
            }
          })

          //获取帖子分类对应名称
          sorts.where({
            _id: res.data[i].sortId
          }).get({
            success: function (res) {
              post.sortName = res.data[0].name
            }
          })

          //获取评论数量
          comments.where({
            postId: res.data[i]._id
          }).count({
            success: function (res) {
              post.commentsCount = res.total
            }
          })

          //获取点赞数量
          praises.where({
            postid: res.data[i]._id
          }).count({
            success: function (res) {
              post.praisesCount = res.total
            }
          })

          //获取是否已点赞
          praises.where({
            postid: res.data[i]._id,
            openid: app.globalData.openid
          }).count({
            success: function (res) {
              if (res.total > 0) {
                post.isPraise = true
              }
            }
          })


          var Posts = that.data.Posts;
          Posts.push(post);
          that.setData({
            Posts: Posts
          })

        }
      }
    })
  },
  /**
   * 获取登陆用户信息
   */
  getUser: function () {
    var that = this;
    var user = [];
    app.globalData.User = []
    if (this.data.User.length == 0) {
      console.log("未获取用户信息,尝试数据库获取");
      var flag = false
      var getuser = setInterval(function () {
        if (typeof (app.globalData.openid) == "undefined") {
          console.log("用户信息获取", app.globalData.openid);
        } else {
          console.log("openid获取成功", app.globalData.openid);
          users.where({
            _openid: app.globalData.openid
          }).get({
            success: function (res) {
              if (res.data.length == 0) {
                console.log("数据库中不包含用户信息，跳转授权页")
                //wx.navigateTo({
                //  url: '/pages/login/login?status=-1',
                //})
                that.setData({
                  loginStatus: -1
                })
              } else if (new Date() - res.data[0].updateTime > 1296000000) {
                //console.log("用户授权已超过15天，跳转授权页")
                //wx.navigateTo({
                //  url: '/pages/login/login?status=0',
                //})
                that.setData({
                  loginStatus: 0
                })
              } else {
                flag = true
                console.log("已授权，将各项信息存入data")
                that.setData({
                  loginStatus: 1
                })
                user[0] = res.data[0].openid
                user[1] = res.data[0].profile
                user[2] = res.data[0].nickname
                app.globalData.User = user;
                that.setData({
                  User: user
                })

                console.log(user)
              }
            }
          })
          clearInterval(getuser)
        }
      }, 100)
    }
  },
  /**
   * 判断是否已经成功登陆
   */
  isLogin: function () {
    if (this.data.loginStatus == -1) {
      wx.showToast({
        title: '未登录',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login?status=-1',
        })
      }, 1000);
      return false
    } else if (this.data.loginStatus == 0) {
      wx.showToast({
        title: '登陆过期',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login?status=0',
        })
      }, 1000);
      return false
    } else if (app.globalData.User.length >= 3) {
      return true
    } else if (this.data.User.length >= 3) {
      return true
    } else {
      return false
    }

  },
  /**
   * 根据postId删除帖子
   * @param {string} postId 
   */
  deletePost: function (postId) {
    console.log("进入deletePost", postId)
    posts.doc(postId).remove({
      success: function (res) {
        console.log(res)
      }
    })
  },
  /**
   * 点击帖子触发跳转
   */
  postOnTap: function (e) {
    if (this.data.isTap) {
      if (this.isLogin()) {
        let str = JSON.stringify(e.currentTarget.dataset.post)
        wx.navigateTo({
          url: "../postDetails/postDetails?str=" + str
        })
      }
    } else {
      console.log("点击了按钮")
      this.setData({
        isTap: true
      })
    }


  },
  /**
   * 页面加载触发事件
   */
  onLoad() {
    wx.cloud.init({
      env: 'moment-7gyx9ooq74b057e1'
    })
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
    this.setData({
      search: this.search.bind(this)
    })
    //this.getItem();
    wx.showToast({
      icon: 'loading',
      title: '正在加载',
      duration: 2000
    })
    var flag = this.getUser()
    console.log(flag)
    this.getPosts();
    this.rewriteSearchbar()

  },
  /**
   * 重写搜索框 用于绑定取消按钮
   */
  rewriteSearchbar: function () {
    let sbar = this.selectComponent("#searchbar"),
      {
        hideInput
      } = sbar
    console.log("searchbar", this.selectComponent("#searchbar"))
    Object.defineProperties(sbar.__proto__, {
      hideInput: {
        configurable: true,
        enumerable: true,
        writable: true,
        value(...p) {
          // 加上这句，同时wxml需要加上bindcancel="cancel"
          //this.triggerEvent('cancel', {})
          // 或者这里直接调用下面的cancel方法，那么wxml就不需要bindcancel
          // t.cancel()

          // 执行原方法，返回原方法结果
          return hideInput.apply(sbar, p)
        }
      }
    })
  },
  /**
   * 清除搜索框内容触发事件
   */
  clearInput: function () {
    console.log("clear")
    this.setData({
      searchOn: false
    })
  },
  /**
   * 点击搜索框取消按钮触发事件
   */
  cancel: function () {
    console.log("cancel")
    var that = this
    console.log(this.data.PostsTemp)
    this.setData({
      Posts: this.data.PostsTemp,
      searchOn: false
    })
    setTimeout(function () {
      that.setData({
        PostsTemp: [],
      })
    }, 500)

    this.onShow()

  },
  /**
   * 页面显示触发事件
   */
  onShow() {
    console.log("进入主页onshow函数")
    if (this.data.reload) {
      this.setData({
        reload: false,
        page: 0
      })
      this.setData({
        Posts: []
      })
      wx.showToast({
        icon: 'loading',
        title: '正在加载',
        duration: 2000
      })
      this.getUser();
      this.getPosts();

    }

    var i = 0
    var load = setInterval(() => {
      this.setData({
        Posts: this.data.Posts
      })
      if (this.data.Posts.length > 10 || i > 100) {
        clearInterval(load);
      }
      i++;
    }, 50)
  },
  /**
   * 点击顶部分类触发事件
   * @param {object} event event.detail为点击后的新id
   */
  onItemtap: function (event) {

    var that = this
    if (event.detail.trim() == this.data.itemsIndex) {
      console.log("选择未发生变化：", event.detail)
    } else {
      that.setData({
        itemsIndex: event.detail.trim(),
        page: 0,
        reload: true
      })
      this.onShow();
      console.log("选择发生变化：", event.detail)
    }

  },
  /**
   * 点击发帖按钮后触发事件
   */
  onPostTap: function () {
    if (this.isLogin()) {
      console.log("posttap")
      wx.navigateTo({
        url: '/pages/post/post', //发帖的地址
      })
    }
  },
  /**
   * 搜索框内容发生变化触发事件
   */
  search: function (value) {
    var that = this
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (value != "") {
          that.setData({
            searchOn: true
          })

          resolve([{
            text: value,
            value: 1
            //}, {
            //  text: value + "在哪",
            //  value: 2
          }])

        } else {
          that.setData({
            searchOn: false
          })
          resolve([]);
        }
      }, 1)
    })
  },

  /**
   * 点击搜索结果后触发事件
   * @param {object} e 
   */
  selectResult: function (e) {
    console.log('select result', e.detail)
    console.log(this.data.PostsTemp)
    console.log(this.data.Posts)
    if (this.data.PostsTemp.length == 0) {
      this.setData({
        PostsTemp: this.data.Posts,
      })
      console.log(this.data.PostsTemp)
    }
    this.setData({
      searchOn: true
    })
    let content = e.detail.item.text
    this.setData({
      Posts: [],
    })
    this.getPostsByContent(e.detail.item.text)
    this.onShow()

  },

  /**
   * 点击点赞按钮触发事件
   * @param {object} e e.currentTarget.dataset.index为点赞帖子在posts中的所属下标
   */
  praiseTap: function (e) {
    this.setData({
      isTap: false
    })
    if (this.isLogin()) {
      let index = e.currentTarget.dataset.index;
      var Posts = this.data.Posts
      if (Posts[index].isPraise) {
        Posts[index].isPraise = false
        Posts[index].praisesCount--;
        praises.where({
          postid: Posts[index].postId,
          openid: app.globalData.openid
        }).remove({
          success: function (res) {
            console.log(res)
          }
        })
      } else {
        Posts[index].isPraise = true
        Posts[index].praisesCount++;
        praises.add({
          data: {
            postid: Posts[index].postId,
            openid: app.globalData.openid
          },
          success: function (res) {
            console.log(res)
          }
        })
      }
      this.setData({
        Posts: Posts
      })
    }
  },
  /**
   * 点击图片触发事件
   * @param {object}} e 
   * e.currentTarget.dataset.index 为帖子在posts中的所属下标
   * e.currentTarget.dataset.imageindex 为image在post中的所属下标
   */
  imgTap: function (e) {
    /**console.log(e.currentTarget.dataset.src)
    var urls=[];
    urls['urls'] = [];
    urls['urls']=urls['urls'].concat("./"+e.currentTarget.dataset.src)
    this.previewImage("./"+e.currentTarget.dataset.src,urls['urls'])
    console.log(urls['urls']);**/
    this.setData({
      isTap: false
    })
    var url = this.data.Posts[e.currentTarget.dataset.index].images[e.currentTarget.dataset.imageindex];
    var urls = [];
    urls['urls'] = [];
    urls['urls'] = urls['urls'].concat(url);
    this.previewImage(url, this.data.Posts[e.currentTarget.dataset.index].images)


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
  /**
   * 点击删除按钮触发事件
   * @param {object} e 
   * e.currentTarget.dataset.postid为所属帖子id
   * e.currentTarget.dataset.index为帖子在posts中的下标
   */
  deleteTap: function (e) {
    this.setData({
      isTap: false
    })
    if (this.isLogin()) {
      this.setData({
        showDelete: true,
        commandId: e.currentTarget.dataset.postid,
        deleteIndex: e.currentTarget.dataset.index
      })
      console.log("删除", e.currentTarget.dataset.postid)
    }
  },
  /**
   * 点击举报按钮触发事件
   * @param {object} e 
   * e.currentTarget.dataset.postid为所属帖子id
   * e.currentTarget.dataset.index为帖子在posts中的下标
   */
  reportTap: function (e) {
    this.setData({
      isTap: false
    })
    if (this.isLogin()) {
      this.setData({
        showReport: true,
        commandId: e.currentTarget.dataset.postid
      })
      console.log("举报", e.currentTarget.dataset.postid)
    }
  },
  /**
   * 确认举报触发事件
   */
  reportConfirm: function (e) {
    this.setData({
      showReport: false
    })
    wx.showToast({
      title: '已举报'
    })
  },
  /**
   * 确认删除触发事件
   */
  deleteConfirm: function (e) {
    var Posts = this.data.Posts
    Posts.splice(this.data.deleteIndex, 1)
    this.setData({
      showDelete: false,
      Posts: Posts
    })
    this.deletePost(this.data.commandId)
    wx.showToast({
      title: '已删除'
    })
  },
  /**
   * 页面下滑至底部触发事件
   * 下滑到底部后，分页page属性+1
   * 执行getPosts()和onShow()函数
   */
  onReachBottom: function (e) {

    if (!this.data.searchOn) {

      this.setData({
        page: this.data.page + 1
      })
      this.getPosts()
      this.onShow()
    }
  }

})