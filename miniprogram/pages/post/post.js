// miniprogram/pages/post/post.js
const app = getApp()
const db = wx.cloud.database()
const sorts = db.collection('Sorts')
const posts = db.collection('Posts')
var sections
Page({

  /**
   * 页面的初始数据
   */
  data: {
    mtop: app.globalData.height * 2 + 22 + "px",
    length: 0,
    sections: ["请选择板块"],
    sectionId: ["0"],
    sectionIndex: 0,
    content: "",
    navbarData: {
      title: "发帖",
      show: 0,
      back: 1
    },
    urlArr: [],
    fileID: [],
    isSubmit: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(app.globalData.openid)
    this.setData({
      selectFile: this.selectFile.bind(this),
      uplaodFile: this.uplaodFile.bind(this),
    });
    var sections = this.data.sections;
    var sectionId = this.data.sectionId;
    var that = this;
    sorts.get({
      success: function (res) {
        for (let i = 0; i < res.data.length; i++) {
          //sections[res.data[i]._id] = res.data[i].name;
          sections.push(res.data[i].name)
          sectionId.push(res.data[i]._id)
        }
        that.setData({
          sections: sections,
          sectionId: sectionId
        })
      }
    })
    console.log(this.data.sections)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

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

  },

  TextareaInput: function (e) {
    this.setData({
      length: e.detail.value.length,
      content: e.detail.value
    })
  },

  chooseImage: function (e) {
    var that = this;
    wx.chooseImage({
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        that.setData({
          files: that.data.files.concat(res.tempFilePaths)
        });
      }
    })
  },
  /**previewImage: function (e) {
    wx.previewImage({
      current: e.currentTarget.id, // 当前显示图片的http链接
      urls: this.data.files // 需要预览的图片http链接列表
    })
  },**/
  selectFile(files) {
    console.log('files', files)
    // 返回false可以阻止某次文件上传
  },
  uplaodFile(files) {
    var that = this;
    console.log('upload files', files)
    // 文件上传的函数，返回一个promise
    return new Promise((resolve, reject) => {
      var tempFilePaths = files.tempFilePaths;
      var object = [];
      object['urls'] = [];
      var flag = false;
      var count = 0;
      var urlArr = that.data.urlArr;
      var fileID = that.data.fileID;
      for (let i = 0; i < tempFilePaths.length; i++) {
        var extension = tempFilePaths[i].substr(tempFilePaths[i].lastIndexOf("."));
        console.log("扩展名：" + extension);
        wx.cloud.uploadFile({
          cloudPath: 'uploadImg/' + new Date().getTime() + Math.ceil(Math.random() * 1000) + extension, // 上传至云端的路径
          filePath: tempFilePaths[i], // 小程序临时文件路径
          success: res => {
            console.log("上传成功fileID:" + res.fileID);
            //返回文件id到全局数据
            fileID.push(res.fileID)
            that.setData({
              fileID: fileID
            });
            wx.cloud.getTempFileURL({
              fileList: [res.fileID],
              success: res => {
                console.log("临时url:", res.fileList[0].tempFileURL);
                //返回url到全局数据
                urlArr.push(res.fileList[0].tempFileURL)
                that.setData({
                  urlArr: urlArr
                });
                object['urls'] = object['urls'].concat(res.fileList[0].tempFileURL);
              },
              fail: console.error
            })
          },
          fail: console.error
        });
        if ((i + 1) >= tempFilePaths.length) {
          flag = true;
        }
      }

      var re = setInterval(() => {
        if (object['urls'].length > 0 && flag) {
          resolve(object);
          clearInterval(re);
        } else {
          count++
          if (count > 100) {
            reject('上传超时')
            clearInterval(re);
          }
        }
      }, 100)
    })
  },
  uploadError(e) {
    console.log('upload error', e.detail)
  },
  uploadSuccess(e) {
    console.log('upload success', e.detail)
  },
  deleteImg(e) {
    console.log('deleteImg', e.detail)
    var urlArr = this.data.urlArr;
    var fileID = this.data.fileID;
    urlArr.splice(e.detail.index, 1);
    fileID.splice(e.detail.index, 1);
    this.setData({
      urlArr: urlArr,
      fileID: fileID
    })
  },
  bindSectionChange: function (e) {
    console.log('板块选择发生变化,下标为', e.detail.value);
    console.log('对应名称为', this.data.sections[e.detail.value]);
    console.log('对应id为', this.data.sectionId[e.detail.value]);
    this.setData({
      sectionIndex: e.detail.value
    })
  },
  bindSectionTap: function (e) {
    this.setData({
      sections: sections
    })

    console.log('setdata');
  },
  submitForm() {
    console.log(this.data.length);
    console.log(this.data.fileID)
    console.log(this.data.urlArr)
    if (this.data.length === 0) {
      wx.showToast({
        title: '请先编辑帖子',
        icon: 'error'
      })
    } else if (this.data.length < 10) {
      wx.showToast({
        title: '最少10字哦',
        icon: 'error'
      })
    } else if (this.data.sectionIndex === '0' || this.data.sectionIndex === 0) {
      wx.showToast({
        title: '请选择板块',
        icon: 'error'
      })
    } else if (this.data.isSubmit == 1) {
      wx.showToast({
        title: '请勿重复提交',
        icon: 'error'
      })
    } else {
      this.setData({
        isSubmit: 1
      })
      posts.add({
        data: {
          openid: app.globalData.openid,
          content: this.data.content,
          sortId: this.data.sectionId[this.data.sectionIndex],
          images: this.data.fileID,
          createTime: new Date()
        },
        success: function (res) {
          console.log(res)
          wx.showToast({
            title: '提交成功'
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
        }
      })
    }
  }
})