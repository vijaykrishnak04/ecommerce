const user = require("../model/userSchema");

const adminController = {
  //admin login

  getAdminLogin: async (req, res) => {
    const admin = req.session.admin;
    if (admin) {
      res.render("admin/home");
    } else {
      res.render("admin/login");
    }
  },

  postAdminLogin: (req, res) => {
    if (
      req.body.email === process.env.ADMIN_GMAIL &&
      req.body.password === process.env.ADMIN_PASS
    ) {
      req.session.admin = process.env.ADMIN_GMAIL;
      res.redirect("/admin");
    } else {
      res.render("admin/login", { invalid: "invalid username or password" });
    }
  },

  //admin home

  getAdminHome: (req, res) => {
    const admin = req.session.admin;
    if (admin) {
      res.render("admin/home");
    } else {
      res.render("admin/login");
    }
  },

  //admin logout

  adminLogout: (req, res) => {
    req.session.destroy();
    res.redirect("/admin");
  },

  //get all users

  getAllUsers: async (req, res) => {
    let users = await user.find();
    res.render("admin/userDetails", { users });
  },

  //block user

  blockUser: async (req, res) => {
    const id = req.params.id;
    await user
      .updateOne({ _id: id }, { $set: { isBlocked: true } })
      .then(() => {
        res.redirect("/admin/userDetails");
      });
  },

  //unblock user

  unblockUser: async (req, res) => {
    const id = req.params.id;
    await user
      .updateOne({ _id: id }, { $set: { isBlocked: false } })
      .then(() => {
        res.redirect("/admin/userDetails");
      });
  },


  
};

module.exports = adminController;
