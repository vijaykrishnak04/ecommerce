const mongoose = require("mongoose");
const categories = require("../model/categorySchema");
const products = require("../model/productSchema");
const fs = require("fs");
const cart = require("../model/cartSchema");
const users = require("../model/userSchema");
const { log } = require("console");

let countInCart;
let countInWishlist;

module.exports = {



  //add product

  addProduct: async (req, res) => {
    try {
      const category = await categories.find();
      res.render("admin/addProduct", { category: category });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  postProduct: async (req, res) => {
    try {
      const categoryId = req.body.category;
      const images = req.files.map(file => ({ path: file.filename }))
      const newproduct = products({
        name: req.body.product_name,
        price: req.body.price,
        category: categoryId,
        description: req.body.description,
        image: images,
        stock: req.body.stock,
      });
      newproduct
        .save()
        .then(function () {
          res.redirect("/admin/productDetails");
          console.log("product added succesfully");
        })
        .catch((err) => {
          console.log(err + "product adding failed");
        });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  productDetails: async (req, res) => {
    try {
      const admin = req.session.admin;
      if (admin) {
        const product = await products.find().populate("category");
        const productCount = await products.find().count()
        res.render("admin/productDetails", { product, productCount });
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //edit Product

  editProduct: async (req, res) => {
    try {
      const id = req.params.id;
      const category = await categories.find();
      const productData = await products.findOne({ _id: id });
      res.render("admin/editProduct", { productData, category });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  postEditProduct: async (req, res) => {
    try {
      const id = req.params.id;
      await products.updateOne(
        { _id: id },
        {
          $set: {
            name: req.body.name,
            price: req.body.price,
            category: req.body.category,
            description: req.body.description,
            stock: req.body.stock,
          },
        }
      );
      res.redirect("/admin/productDetails");
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //image edit

  imageEdit: async (req, res) => {
    try {
      const productId = req.params.id;
      const imageId = req.params.imageId;
      const imageFile = req.file;

      // update the image with the new file data
      const result = await products.updateOne(
        { _id: productId, 'image._id': imageId },
        { $set: { 'image.$.path': imageFile.filename } }
      );
      res.redirect("/admin/productDetails");
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  },

  //delete product

  deleteProduct: async (req, res) => {
    try {
      const id = req.params.id;
      await products.updateOne({ _id: id }, { $set: { delete: true } });
      await cart.updateMany({}, { $pull: { product: { productId: id } } });
      res.redirect("/admin/productDetails");
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //restore product

  restoreProduct: async (req, res) => {
    try {
      const id = req.params.id;
      await products.updateOne({ _id: id }, { $set: { delete: false } });
      res.redirect("/admin/productDetails");
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //product view and manage

  getShopPage: async (req, res) => {
    try {
      let category = await categories.find();
      let product = await products.find({ delete: false }).populate("category");
      let productCount = await products.find({ delete: false }).count();
      res.render("user/shop", { product, category, productCount });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  //search product

  searchProduct: async (req, res, next) => {
    try {
      const searchInput = req.body
      const category = await categories.find();
      const searchTerm = searchInput.searchInput;
      const product = await products.find({ name: { $regex: searchTerm, $options: 'i' } });
      const productCount = product.length
      res.render('user/shop', { product, category, productCount })

    } catch (err) {
      console.log(err);
      next(err)
    }
  },

  getCategoryWisePage: async (req, res) => {
    try {
      const id = req.params.id;
      const category = await categories.find();
      const product = await products
        .find({ category: id, delete: false })
        .populate("category");
      const productCount = await products
        .find({ category: id, delete: false })
        .populate("category")
        .count();
      res.render("user/shop", {
        product,
        countInCart,
        category,
        countInWishlist,
        productCount,
      });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  getProductViewPage: async (req, res) => {
    try {
      let id = req.params.id;
      let product = await products.findOne({ _id: id }).populate("category");
      res.render("user/productView", {
        products: product,
        countInCart,
        countInWishlist,
      });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
};
