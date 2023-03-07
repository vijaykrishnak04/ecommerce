const banner = require('../model/bannerSchema')

module.exports = {
  getBannerPage: async (req, res) => {
    const bannerData = await banner.find()
    res.render('admin/banner', { bannerData });
  },
  addBanner: async (req, res) => {
    try {
      await banner.create({
        offerType: req.body.offerType,
        bannerText: req.body.bannerText,
        couponName: req.body.couponName,
      }).then(() => {
        res.redirect('/admin/getBanner')
      })
    } catch {
      console.error();
      res.render('user/error');
    }

  },
  editBanner: async (req, res) => {
    try {
      const id = req.params.id;
      const editedData = req.body;
      await banner.updateOne(
        { _id: id },
        {
          offerType: editedData.offerType,
          bannerText: editedData.bannerText,
          couponName: editedData.couponName,
        }
      ).then(() => {
        res.redirect('/admin/getBanner');
      })
    } catch {
      console.error()
      res.render("user/error")
    }
  },
  deleteBanner: async (req, res) => {
    try {
      const id = req.params.id;
      await banner.updateOne(
        { _id: id },
        { isDeleted: true }
      ).then(() => {
        res.redirect('/admin/getBanner');
      })
    } catch {
      console.error();
      res.render("user/error");
    }
  },
  restoreBanner: async (req, res) => {
    try {
      const id = req.params.id;
      await banner.updateOne(
        { _id: id },
        { isDeleted: false }
      ).then(() => {
        res.redirect('/admin/getBanner');
      })
    } catch {
      console.error()
      res.redirect("/admin/getBanner");
    }
  },
}