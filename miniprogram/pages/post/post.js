// miniprogram/pages/post/post.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    mtop: app.globalData.height * 2 + 22 + "px",
    length: 0,
    sections: ["请选择板块", "二手闲置", "悬赏问答", "寻人问答", "校园拼车"],
    sectionIndex: 0,
    navbarData: {
      title: "发帖",
      show: 0,
      back: 1
    },
    urlArr: [],
    fileID: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      selectFile: this.selectFile.bind(this),
      uplaodFile: this.uplaodFile.bind(this)
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

  },

  TextareaInput: function (e) {
    this.setData({
      length: e.detail.value.length
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
  previewImage: function (e) {
    wx.previewImage({
      current: e.currentTarget.id, // 当前显示图片的http链接
      urls: this.data.files // 需要预览的图片http链接列表
    })
  },
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

      that.setData({
        urlArr: [],
        fileID: []
      });
      var object = [];
      object['urls'] = [];
      var flag = false;
      var count = 0;
      for (var i = 0; i < tempFilePaths.length; i++) {
        var extension = tempFilePaths[i].substr(tempFilePaths[i].lastIndexOf("."));
        console.log("扩展名：" + extension);
        wx.cloud.uploadFile({
          cloudPath: 'uploadImg/' + new Date().getTime() + Math.ceil(Math.random() * 1000) + extension, // 上传至云端的路径
          filePath: tempFilePaths[i], // 小程序临时文件路径
          success: res => {
            console.log("上传成功fileID:" + res.fileID);
            //返回文件id到全局数据
            that.setData({
              ['fileID[' + (i - 1) + ']']: res.fileID
            });
            wx.cloud.getTempFileURL({
              fileList: [that.data.fileID[(i - 1)]],
              success: res => {
                console.log("临时url:", res.fileList[0].tempFileURL);
                //返回url到全局数据
                that.setData({
                  ['urlArr[' + (i - 1) + ']']: res.fileList[0].tempFileURL
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
  bindSectionChange: function (e) {
    console.log('板块选择发生变化', e.detail.value);
    this.setData({
      sectionIndex: e.detail.value
    })
    console.log('sectionIndex', this.data.sectionIndex);
  },
  submitForm() {
    console.log(this.data.length);
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
    } else {
      console.log('sectionIndex', this.data.sectionIndex);
      wx.showToast({
        title: '提交成功'
      })
    }
  }
})