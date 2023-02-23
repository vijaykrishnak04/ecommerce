const coupon = require('../model/couponSchema');

module.exports = {
    getCouponPage: async (req, res) => {
        try {
            const couponData = await coupon.find()
            res.render('admin/coupon', { couponData });
        } catch (error) {
            console.log(error);
            res.render("user/error");
        }
    },

    addCoupon: (req, res) => {
        try {
            const data = req.body;
            const dis = parseInt(data.discount);
            const maxLimit = parseInt(data.maxLimit);
            const discount = dis / 100;
            coupon.create({
                couponName: data.couponName,
                discount: discount,
                maxLimit: maxLimit,
                expirationTime: data.expirationTime,
            }).then((data) => {
                // console.log(data);
                res.redirect("/admin/coupon")
            });
        } catch {
            console.error();
            res.render("user/error")
        }
    },

    deleteCoupon: async (req, res) => {
        try {
            const id = req.params.id;
            await coupon.updateOne({ _id: id }, { $set: { delete: true } })
            res.redirect('/admin/coupon');
        } catch (error) {
            console.log(error);
            res.render("user/error");
        }
    },

    restoreCoupon: async (req, res) => {
        try {
            const id = req.params.id;
            await coupon.updateOne({ _id: id }, { $set: { delete: false } });
            res.redirect("/admin/coupon");
        } catch (error) {
            console.log(error);
            res.render("user/error");
        }
    },

    removeCoupon: async (req, res) => {
        try {
            const id = req.params.id;
            await coupon.deleteOne({ _id: id });
            res.redirect("/admin/coupon");
        } catch (error) {
            console.log(error);
            res.render("user/error");
        }
    },

    editCoupon: async (req, res) => {
        try {
            const id = req.params.id;
            const data = req.body;
            coupon.updateOne(
                { _id: id },
                {
                    couponName: data.couponName,
                    discount: data.discount / 100,
                    maxLimit: data.maxLimit,
                    expirationTime: data.expirationTime
                }
            ).then(() => {
                res.redirect("/admin/coupon");
            })
        } catch {
            console.error();
        }
    },
}