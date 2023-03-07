const user = require('../model/userSchema');
const order = require('../model/orderSchema')
const products = require('../model/productSchema')
const moment = require("moment");
moment().format();


const adminController = {
  //admin login

  getAdminLogin: async (req, res) => {
    try {
      const admin = req.session.admin;
      if (admin) {
        res.render("admin/home");
      } else {
        res.render("admin/login");
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  postAdminLogin: (req, res) => {
    try {
      if (
        req.body.email === process.env.ADMIN_GMAIL &&
        req.body.password === process.env.ADMIN_PASS
      ) {
        req.session.admin = process.env.ADMIN_GMAIL;
        res.redirect("/admin/home");
      } else {
        res.render("admin/login", { invalid: "invalid username or password" });
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //admin home

  getAdminHome:async (req, res) => {
    try {
      const orderData = await order.find({ orderStatus: { $ne: "cancelled" } });
      const totalRevenue = orderData.reduce((accumulator, object) => {
        return accumulator + object.totalAmount;
      }, 0);
      const todayOrder = await order.find({
        orderDate: moment().format("MMM Do YY"),
      });
      const todayRevenue = todayOrder.reduce((accumulator, object) => {
        return accumulator + object.totalAmount;
      }, 0);
      const start = moment().startOf("month");
      const end = moment().endOf("month");
      const oneMonthOrder = await order.find({ orderStatus: { $ne: "cancelled" }, createdAt: { $gte: start, $lte: end }, })
      const monthlyRevenue = oneMonthOrder.reduce((accumulator, object) => {
        return accumulator + object.totalAmount
      }, 0);
      const allOrders = orderData.length;
      const pending = await order.find({ orderStatus: "pending" }).count();
      const shipped = await order.find({ orderStatus: "shipped" }).count();
      const delivered = await order.find({ orderStatus: "delivered" }).count();
      const cancelled = await order.find({ orderStatus: "cancelled" }).count();
      const cod = await order.find({ paymentMethod: "COD" }).count();
      const online = await order.find({ paymentMethod: "Online" }).count();
      const activeUsers = await user.find({ isBlocked: false }).count();
      const product = await products.find({ delete: false }).count();
      res.render('admin/home', { cod, online, pending, shipped, delivered, cancelled, totalRevenue, allOrders, activeUsers, product, monthlyRevenue, todayRevenue });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //admin logout

  adminLogout: (req, res) => {
    try {
      req.session.admin = null;
      res.redirect("/admin");
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //get all users

  getAllUsers: async (req, res) => {
    try {
      const users = await user.find();
      res.render("admin/userDetails", { users });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //block user

  blockUser: async (req, res) => {
    try {
      const id = req.params.id;
      await user
        .updateOne({ _id: id }, { $set: { isBlocked: true } })
        .then(() => {
          res.redirect("/admin/userDetails");
        });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //unblock user

  unblockUser: async (req, res) => {
    try {
      const id = req.params.id;
      await user
        .updateOne({ _id: id }, { $set: { isBlocked: false } })
        .then(() => {
          res.redirect("/admin/userDetails");
        });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

};

module.exports = adminController;
