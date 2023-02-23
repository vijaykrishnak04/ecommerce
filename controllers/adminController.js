const user = require("../model/userSchema");

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
        res.redirect("/admin");
      } else {
        res.render("admin/login", { invalid: "invalid username or password" });
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //admin home

  getAdminHome: (req, res) => {
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

  //admin logout

  adminLogout: (req, res) => {
    try {
      req.session.destroy();
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
