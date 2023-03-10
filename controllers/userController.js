const users = require("../model/userSchema");
const bcrypt = require("bcrypt");
const mailer = require("../middlewares/otpValidation");
const mongoose = require("mongoose");
const otp = require("../model/otpSchema");
const mailSender = require("../config/mailSender");
const products = require("../model/productSchema");
const cart = require("../model/cartSchema");
const banner = require('../model/bannerSchema')
const carousal = require('../model/carousalSchema')
const categories = require("../model/categorySchema");

let countInCart = 0;

module.exports = {
  //to render the home page
  getHome: async (req, res) => {
    try {

      const session = req.session.user;
      const product = await products.find({ delete: false }).populate("category");
      const bannerData = await banner.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(1);
      const carousalData = await carousal.find({ isDeleted: false }).sort({ createdAt: -1 });
      console.log(carousalData);
      const category = await categories.find({category_Image:true}).limit(4);
      if (session) {
        customer = true;
      } else {
        customer = false;
      }
      res.render("user/home", { customer, product, bannerData, category, carousalData });
    } catch (error) {
      console.log(error);
      next(error)
    }
  },
  
  //to render the login page
  getLogin: (req, res) => {

    const session = req.session.user;
    if (session) {
      customer = true;
    } else {
      customer = false;
    }
    res.render("user/login",{customer});
  },

  postLogin: async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await users.findOne({ email: email });
    try {
      if (userData) {
        if (userData.isBlocked === false) {
          const passwordMatch = await bcrypt.compare(
            password,
            userData.password
          );
          if (passwordMatch) {
            req.session.user = req.body.email;
            res.redirect("/");
          } else {
            res.render("user/login", {
              invalid: "Invalid username or Password",
            });
          }
        } else {
          res.render("user/login", { invalid: "You are blocked" });
        }
      } else {
        res.render("user/login", { invalid: "Invalid Email Or Password" });
      }
    } catch (error) {
      console.log(error);
    }
  },

  //logout

  userLogout: (req, res) => {
    req.session.user = null;
    res.redirect("/");
  },

  // to render the signup page
  getSignup: (req, res) => {
    res.render("user/signup");
  },

  postSignup: async (req, res) => {
    try {
      const spassword = await bcrypt.hash(req.body.password, 10);
      const name = req.body.name;
      const email = req.body.email;
      const phone = req.body.phone;
      const password = spassword;
      const userExists = await users.findOne({ email: email });

      if (userExists) {
        res.render("user/signup", { invalid: "User Already Exist" });
      } else {
        const User = {
          name: name,
          email: email,
          phone: phone,
          password: password,
        };
        mailSender(User).then(async (mailer) => {
          if (mailer) {
            const userData = await otp.findOne({ email: email });
            res.render("user/otp", { userData });
          } else {
            console.log("otp sending failed");
          }
        })
      }
    } catch (error) {
      console.log(error);
      res.render("user/500");
    }
  },

  postOtp: async (req, res) => {
    try {
      const body = req.body;
      const cotp = body.otp;
      const sendOtp = await otp.findOne({ email: body.email });
      const validOtp = await bcrypt.compare(cotp, sendOtp.otp);
      if (validOtp) {
        res.redirect("/login");
        users.create({
          name: body.name,
          email: body.email,
          phone: body.phone,
          password: body.password,
        });
        await otp.findOneAndDelete({ email: body.email })
      } else {
        const userData = await otp.findOne({ email: body.email });
        res.render("user/otp", { userData, invalid: "invalid otp" });
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //forget password

  forgotPassword: (req, res) => {
    res.render("user/forgotPassword");
  },

  postForgotPassword: async (req, res) => {
    try {
      const userEmail = req.body.email;
      const User = req.body;
      const isUserExist = await users.findOne({ email: userEmail });
      if (isUserExist) {
        const mailer = await mailSender(User);
        if (mailer) {
          res.render("user/forgotOtp", { User });
        }
      } else {
        res.render("user/forgotPassword", {
          error: "please enter a valid Email",
          userData,
        });
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  postForgotOtp: async (req, res) => {
    const userData = req.query;
    try {
      const body = req.body;
      const cotp = body.otp;
      const sendOtp = await otp.findOne({ email: body.email });
      const validOtp = await bcrypt.compare(cotp, sendOtp.otp);
      if (validOtp) {
        res.render("user/changePassword", { userData });
      } else {
        res.render("user/forgotOTP", { userData, error: "invalid OTP" });
      }
    } catch (error) {
      res.render("user/error");
    }
  },

  postChangePassword: async (req, res) => {
    try {
      const newPassword = req.body.newPassword;
      const sNewPassword = await bcrypt.hash(newPassword, 10);
      const filter = { email: req.body.email };
      const update = { password: sNewPassword };
      await users
        .findOneAndUpdate(filter, update, {
          new: true,
        })
        .then(() => {
          res.redirect("/login");
        });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  getResetpassword: (req, res) => {
    res.render('user/editPassword')
  },

  postResetPassword: async (req, res) => {
    try {
      Email = req.session.user
      const password = req.body.password
      const userData = await users.findOne()
      const passwordMatch = await bcrypt.compare(
        password,
        userData.password
      );
      if (passwordMatch) {
        const newPassword = req.body.newPassword;
        const sNewPassword = await bcrypt.hash(newPassword, 10);
        const filter = { email: Email };
        const update = { password: sNewPassword };
        await users
          .findOneAndUpdate(filter, update, {
            new: true,
          })
          .then(() => {
            res.redirect("/viewProfile");
          });
      } else {
        console.log("password not match")
        res.render('user/editPassword', { error: "invalid Password" })
      }

    } catch (error) {
      console.log(error)
      res.render("user/error")
    }
  },

  //profile view management

  viewProfile: async (req, res) => {
    try {
      const session = req.session.user;
      const userData = await users.findOne({ email: session });
      const walletDetails = userData.walletDetails
      res.render("user/profile", { userData, walletDetails });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  editProfile: async (req, res) => {
    try {
      const session = req.session.user;
      const userData = await users.findOne({ email: session });
      res.render("user/editProfile", { userData });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  postEditProfile: async (req, res) => {
    try {
      const session = req.session.user;
      await users.updateOne(
        { email: session },
        {
          $set: {
            name: req.body.name,
            phonenumber: req.body.phone,
            addressDetails: [
              {
                housename: req.body.housename,
                area: req.body.area,
                landMark: req.body.landmark,
                district: req.body.district,
                state: req.body.state,
                postoffice: req.body.postoffice,
                pin: req.body.pin,
              },
            ],
          },
        }
      );

      res.redirect("/viewProfile");
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  addNewAddress: async (req, res) => {
    try {
      const session = req.session.user
      const addObj = {
        housename: req.body.housename,
        phone: req.body.phone,
        area: req.body.area,
        landMark: req.body.landmark,
        district: req.body.district,
        state: req.body.state,
        postoffice: req.body.postoffice,
        pin: req.body.pin
      }
      await users.updateOne({ email: session }, { $push: { addressDetails: addObj } })
      res.redirect('/checkout')
    } catch (error) {
      console.log(error);
      next(error)
    }
  },
};
