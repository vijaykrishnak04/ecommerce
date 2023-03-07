const mongoose = require("mongoose");
const cart = require("../model/cartSchema");
const users = require("../model/userSchema");

let countInCart;
let countInWishlist;

module.exports = {
  //cart view management

  viewCart: async (req, res) => {
    try {
      const session = req.session.user;
      const userData = await users.findOne({ email: session });
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
      res.render("user/cart", {
        productData,
        sum,
        countInCart,
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

      const proObj = {
        productId: objId,
        quantity: 1,
      };
      const userData = await users.findOne({ email: session });
      const userCart = await cart.findOne({ userId: userData._id });
      if (userCart) {
        const proExist = userCart.product.findIndex(
          (product) => product.productId == id
        );
        if (proExist != -1) {
          await cart.aggregate([
            {
              $unwind: "$product",
            },
          ]);
          await cart.updateOne(
            { userId: userData._id, "product.productId": objId },
            { $inc: { "product.$.quantity": 1 } }
          );
          res.json({ success: true })
        } else {
          cart
            .updateOne({ userId: userData._id }, { $push: { product: proObj } })
            .then(() => {
              res.json({ success: true })
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
          res.json({ success: true })
        });
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },


  changeQuantity: (req, res, next) => {
    try {
      const data = req.body
      const objId = mongoose.Types.ObjectId(data.product)

      if (data.count == -1 && data.quantity == 1) {
        cart.updateOne(
          { _id: data.cart, "product.productId": objId },
          { $pull: { product: { productId: objId } } }
        )
          .then(() => {
            res.json({ quantity: true })
          }).catch(err => console.log(err))
      } else {
        cart.updateOne(
          { _id: data.cart, "product.productId": objId },
          { $inc: { "product.$.quantity": data.count } }
        ).then(async () => {
          // Get updated product data
          const productData = await cart.aggregate([
            {
              $match: { _id: mongoose.Types.ObjectId(data.cart) }
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
            {
              $group: {
                _id: null,
                total: {
                  $sum: { $multiply: ["$productQuantity", "$productDetail.price"] },
                },
              },
            },
          ]).exec();
          res.json({ success: true, productData: productData })
        })
      }
    } catch (err) {
      console.log(err);
      next(err)
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
      next(error)
    }
  },
}