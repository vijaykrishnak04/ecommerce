const coupon = require('../model/couponSchema');

module.exports = {
    getCouponPage: async (req, res) => {
        try {
            const couponData = await coupon.find()
            const couponCount = await coupon.find().count()
            res.render('admin/coupon', { couponData, couponCount });
        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    addCoupon: (req, res) => {
        try {
            const data = req.body;
            const dis = data.discount;
            const maxLimit = data.maxLimit;
            const discount = dis / 100;
            coupon.create({
                couponName: data.couponName,
                discount: discount,
                maxLimit: maxLimit,
                expirationTime: data.expirationTime,
            }).then(() => {
                // console.log(data);
                res.redirect("/admin/coupon")
            });
        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    deleteCoupon: async (req, res) => {
        try {
            const id = req.params.id;
            await coupon.updateOne({ _id: id }, { $set: { delete: true } })
            res.redirect('/admin/coupon');
        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    restoreCoupon: async (req, res) => {
        try {
            const id = req.params.id;
            await coupon.updateOne({ _id: id }, { $set: { delete: false } });
            res.redirect("/admin/coupon");
        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    removeCoupon: async (req, res) => {
        try {
            const id = req.params.id;
            await coupon.deleteOne({ _id: id });
            res.redirect("/admin/coupon");
        } catch (error) {
            console.log(error);
            next(error)
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
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
}