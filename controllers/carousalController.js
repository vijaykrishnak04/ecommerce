const { Error } = require('mongoose');
const carousal = require('../model/carousalSchema')


module.exports = {


    getBannerPage: async (req, res, next) => {
        try {
            const bannerData = await carousal.find()
            res.render('admin/carousalBanner', { bannerData });
        } catch (err) {
            next(err)
        }
    },


    addBanner: async (req, res, next) => {
        try {
            await carousal.create({
                offerType: req.body.offerType,
                bannerText: req.body.bannerText,
                couponName: req.body.couponName,
                bannerImage: req.file.filename,
            }).then(() => {
                res.redirect('/admin/getCarousal')
            })
        } catch (err) {
            next(err)
        }

    },

    editBanner: async (req, res, next) => {
        try {



            const id = req.params.id;
            const editedData = req.body;
            await carousal.updateOne(
                { _id: id },
                {
                    offerType: editedData.offerType,
                    bannerText: editedData.bannerText,
                    couponName: editedData.couponName,
                }
            ).then(() => {
                res.redirect('/admin/getCarousal');
            })

        } catch (err) {
            next(err)
        }
    },

    deleteBanner: async (req, res, next) => {
        try {

            const id = req.params.id;
            await carousal.updateOne({ _id: id }, { $set: { isDeleted: true } })
            res.redirect('/admin/getCarousal');
        } catch (err) {
            next(err)
        }

    },

    restoreBanner: async (req, res, next) => {
        try {
            const id = req.params.id;
            await carousal.updateOne({ _id: id }, { $set: { isDeleted: false } });
            res.redirect("/admin/getCarousal");
        } catch (err) {
            next(err)
        }
    },


}
