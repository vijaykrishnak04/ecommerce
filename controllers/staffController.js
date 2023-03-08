const staff = require('../model/staffSchema');
const bcrypt = require("bcrypt");

module.exports = {

    //staff login

    getStaffLogin: async (req, res) => {
        try {

        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    //get all staff

    getAllStaff: async (req, res) => {
        try {
            const users = await staff.find();
            res.render("admin/staffDetails", { users });
        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    //add staff

    addStaff: (req, res) => {
        try {
            res.render('admin/addstaff')
        } catch (err) {
            console.log(err);
            next(err)
        }
    },

    postAddStaff: async (req, res) => {
        try {
            const hashpass = await bcrypt.hash(req.body.password, 10)
            staff.create({
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                password: hashpass,
                department: req.body.department,
            }).then(function () {
                res.redirect("/admin/userDetails");
            }).catch((err) => {
                console.log(err + "staff adding failed");
            });

        } catch (error) {

            console.log(error);
            next(error)

        }
    },

    //block staff

    blockStaff: async (req, res) => {
        try {
            const id = req.params.id;
            await staff
                .updateOne({ _id: id }, { $set: { isBlocked: true } })
                .then(() => {
                    res.redirect("/admin/staffDetails");
                });
        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    //unblock staff

    unblockStaff: async (req, res) => {
        try {
            const id = req.params.id;
            await staff
                .updateOne({ _id: id }, { $set: { isBlocked: false } })
                .then(() => {
                    res.redirect("/admin/staffDetails");
                });
        } catch (error) {
            console.log(error);
            next(error)
        }
    },

}