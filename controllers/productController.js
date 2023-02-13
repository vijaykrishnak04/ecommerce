const mongoose = require("mongoose");
const categories = require("../model/categorySchema");
const products = require("../model/productSchema");
const fs = require("fs");
const cart = require("../model/cartSchema");
const users = require("../model/userSchema");

let countInCart;
let countInWishlist;

module.exports = {
  //add product

  countInCart,

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
      let categoryId = req.body.category;
      let image = req.files.map((obj) => {
        return obj?.filename;
      });
      console.log(image);
      const newproduct = products({
        name: req.body.product_name,
        price: req.body.price,
        category: categoryId,
        description: req.body.description,
        image: image,
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
        res.render("admin/productDetails", { product });
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
      if (req.files) {
        let image = req.files.map((obj) => {
          return obj?.filename;
        });
        await products.updateOne(
          { _id: id },
          {
            $set: {
              image: image,
            },
          }
        );
      }
      // const directorypath1 = "public" + req.body.image1;
      // const directorypath2 = "public" + req.body.image2;
      // const directorypath3 = "public" + req.body.image3;
      // const path = [directorypath1, directorypath2, directorypath3];
      // for (i = 0; i < 3; i++) {
      //   fs.unlink(path[i], (err) => {
      //     if (err) {
      //       throw err;
      //     }
      //     console.log("Deleted image successfully");
      //   });
      // }
      res.redirect("/admin/productDetails");
    } catch (error) {
      console.log(error);
      res.render("user/error");
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

  getCategoryWisePage: async (req, res) => {
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
  },

  getProductViewPage: async (req, res) => {
    try {
      let id = req.params.id;
      console.log(id);
      let product = await products.findOne({ _id: id }).populate("category");
      console.log(product);
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

  //cart view management

  viewCart: async (req, res) => {
    try {
      const session = req.session.user;
      const userData = await users.findOne({ email: session });
      console.log(userData.id);
      const productData = await cart
        .aggregate([
          {
            $match: { userId: userData.id },
          },
          {
            $unwind: "$product",
          },

          {
            $project: {
              productItem: "$product.productId",
              productQuantity: "$product.quantity",
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "productItem",
              foreignField: "_id",
              as: "productDetail",
            },
          },
          {
            $project: {
              productItem: 1,
              productQuantity: 1,
              productDetail: { $arrayElemAt: ["$productDetail", 0] },
            },
          },
          {
            $addFields: {
              productPrice: {
                $multiply: ["$productQuantity", "$productDetail.price"],
              },
            },
          },
        ])
        .exec();
      const sum = productData.reduce((accumulator, object) => {
        return accumulator + object.productPrice;
      }, 0);
      countInCart = productData.length;
      let id = req.params.id;
      let product = await products.findOne({ _id: id });
      res.render("user/cart", {
        productData,
        sum,
        countInCart,
        products: product,
        countInWishlist,
      });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  addToCart: async (req, res) => {
    try {
      const id = req.params.id;
      const objId = mongoose.Types.ObjectId(id);
      const session = req.session.user;

      let proObj = {
        productId: objId,
        quantity: 1,
      };
      const userData = await users.findOne({ email: session });
      const userCart = await cart.findOne({ userId: userData._id });
      if (userCart) {
        let proExist = userCart.product.findIndex(
          (product) => product.productId == id
        );
        if (proExist != -1) {
          await cart.aggregate([
            {
              $unwind: "$product",
            },
          ]);
        } else {
          cart
            .updateOne({ userId: userData._id }, { $push: { product: proObj } })
            .then(() => {
              res.redirect("/viewcart");
            });
        }
      } else {
        const newCart = new cart({
          userId: userData.id,
          product: [
            {
              productId: objId,
              quantity: 1,
            },
          ],
        });
        newCart.save().then(() => {
          res.redirect("/viewcart");
        });
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  changeQuantity: async (req, res) => {
    try {
      const data = req.body;
      const objId = mongoose.Types.ObjectId(data.product);
      cart
        .aggregate([
          {
            $unwind: "$product",
          },
        ])
        .then((data) => {});
      if (data.count > 0) {
        cart
          .updateOne(
            { _id: data.cart, "product.productId": objId },
            { $inc: { "product.$.quantity": data.count } }
          )
          .then(() => {
            res.json({ status: true });
          });
      }else{
        cart
          .deleteOne(
            { _id: data.cart, "product.productId": objId },
            { $inc: { "product.$.quantity": data.count } }
          )
          .then(() => {
            res.json({ status: true });
          });
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  removeProduct: async (req, res) => {
    try {
      const data = req.body;
      const objId = mongoose.Types.ObjectId(data.product);
      await cart.aggregate([
        {
          $unwind: "$product",
        },
      ]);
      await cart
        .updateOne(
          { _id: data.cart, "product.productId": objId },
          { $pull: { product: { productId: objId } } }
        )
        .then(() => {
          res.json({ status: true });
        });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
  
};
