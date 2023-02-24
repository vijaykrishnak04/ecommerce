const cart = require("../model/cartSchema");
const users = require("../model/userSchema");
const products = require("../model/productSchema");
const order = require("../model/orderSchema");
const coupon = require("../model/couponSchema");
const moment = require("moment");
const mongoose = require("mongoose");
const promise = require("promise");
const instance = require("../config/razorpay");

let countInCart;
let countInWishlist;

function checkCoupon(data, id) {
  return new promise((resolve) => {
    if (data.coupon) {
      coupon
        .find(
          { couponName: data.coupon },
          { users: { $elemMatch: { userId: id } } }
        )
        .then((exist) => {
          if (exist[0].users.length) {
            resolve(true);
          } else {
            coupon.find({ couponName: data.coupon }).then((discount) => {
              resolve(discount);
            });
          }
        });
    } else {
      resolve(false);
    }
  });
}

module.exports = {
  getCheckOutPage: async (req, res) => {
    try {
      let session = req.session.user;
      const userData = await users.findOne({ email: session });
      const userId = userData._id.toString();
      const productData = await cart
        .aggregate([
          {
            $match: { userId: userId },
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
      const query = req.query;
      await order.deleteOne({ _id: query.orderId });
      res.render("user/checkout", { productData, sum, userData });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
  placeOrder: async (req, res) => {
    try {
      let invalid;
      let couponDeleted;
      const data = req.body;
      const session = req.session.user;
      const userData = await users.findOne({ email: session });
      const cartData = await cart.findOne({ userId: userData._id });
      const objId = mongoose.Types.ObjectId(userData._id);
      if (data.coupon) {
        invalid = await coupon.findOne({ couponName: data.coupon });
        // console.log(invalid);
        if (invalid?.delete == true) {
          couponDeleted = true;
        }
      } else {
        invalid = 0;
      }

      if (invalid == null) {
        res.json({ invalid: true });
      } else if (couponDeleted) {
        res.json({ couponDeleted: true });
      } else {
        const discount = await checkCoupon(data, objId);
        // console.log(discount);
        if (discount == true) {
          res.json({ coupon: true });
        } else {
          if (cartData) {
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
                    productSize: "$Product.size",
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
                    productSize: 1,
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
            if (discount == false) {
              var total = sum;
            } else {
              var dis = sum * discount[0].discount;
              if (dis > discount[0].maxLimit) {
                total = sum - discount[0].maxLimit;
              } else {
                total = sum - dis;
              }
            }
            const orderData = new order({
              userId: userData._id,
              name: userData.name,
              phoneNumber: userData.phone,
              address: req.body.address,
              orderItems: cartData.product,
              totalAmount: total,
              paymentMethod: req.body.paymentMethod,
              orderDate: moment().format("MMM Do YY"),
              deliveryDate: moment().add(3, "days").format("MMM Do YY"),
            });
            console.log(total)
            await cart.deleteOne({ userId: userData._id });

            if (req.body.paymentMethod === "COD") {

              const orderDatas = await orderData.save();
              const orderId = orderDatas._id;

              await order.updateOne(
                { _id: orderId },
                { $set: { orderStatus: "placed" } }
              );

              res.redirect("/orderSuccess");
              await coupon.updateOne(
                { couponName: data.coupon },
                { $push: { users: { userId: objId } } }
              );
            } else {
              const orderDatas = await orderData.save();
              const orderId = orderDatas._id;

              let options = {
                amount: total,
                currency: "INR",
                receipt: "" + orderId,
              };
              instance.orders.create(options, async function (err, Order) {
                await order.updateOne(
                  { _id: orderId },
                  { $set: { orderStatus: "placed" } }
                );
                if (err) {
                  console.log(err);
                } else {
                  res.json({ order: Order });

                  coupon
                    .updateOne(
                      { couponName: data.coupon },
                      { $push: { users: { userId: objId } } }
                    )
                    .then((updated) => {
                      console.log(updated);
                      res.redirect("/orderSuccess");
                    });
                }
              });
            }
          } else {
            res.redirect("/viewCart");
          }
        }
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  verifyPayment: async (req, res, next) => {
    try {
      const details = req.body;
      let hmac = crypto.createHmac("SHA256", process.env.KETSECRET);
      hmac.update(
        details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
      );
      hmac = hmac.digest("hex");

      if (hmac == details.payment.razorpay_signature) {
        const objId = mongoose.Types.ObjectId(details.order.receipt);
        order
          .updateOne(
            { _id: objId },
            { $set: { paymentStatus: "paid", orderStatus: "placed" } }
          )
          .then(() => {
            res.json({ success: true });
          })
          .catch((err) => {
            console.log(err);
            res.json({ status: false, err_message: "payment failed" });
          });
      } else {
        console.log(err);
        res.json({ status: false, err_message: "payment failed" });
      }
    } catch (err) {
      next(err);
    }
  },

  orderSuccess: async (req, res) => {
    try {
      res.render("user/orderSuccess", { countInCart, countInWishlist });
      const query = req.query;
      const orderId = query.orderId;
      await order.updateOne(
        { _id: orderId },
        { $set: { orderStatus: "placed", paymentStatus: "paid" } }
      );
      await cart.deleteOne({ userId: query.cartId });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
  orderDetails: async (req, res) => {
    try {
      const session = req.session.user;
      const userData = await users.findOne({ email: session });
      const userId = userData._id;
      const objId = mongoose.Types.ObjectId(userId);
      console.log(objId);
      const productData = await order
        .aggregate([
          {
            $match: { userId: objId },
          },
          {
            $unwind: "$orderItems",
          },
          {
            $project: {
              productItem: "$orderItems.productId",
              productQuantity: "$orderItems.quantity",
              address: 1,
              name: 1,
              phonenumber: 1,
              totalAmount: 1,
              orderStatus: 1,
              paymentMethod: 1,
              paymentStatus: 1,
              orderDate: 1,
              deliveryDate: 1,
              createdAt: 1,
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
              name: 1,
              phoneNumber: 1,
              address: 1,
              totalAmount: 1,
              orderStatus: 1,
              paymentMethod: 1,
              paymentStatus: 1,
              orderDate: 1,
              deliveryDate: 1,
              createdAt: 1,
              productDetail: { $arrayElemAt: ["$productDetail", 0] },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "productDetail.category",
              foreignField: "_id",
              as: "category_name",
            },
          },
          {
            $unwind: "$category_name",
          },
        ])
        .sort({ createdAt: -1 });
      const orderDetails = await order
        .find({ userId: userData._id })
        .sort({ createdAt: -1 });
      console.log(productData.length);
      res.render("user/orderDetails", {
        productData,
        orderDetails,
        countInCart,
        countInWishlist,
      });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
  orderedProduct: async (req, res) => {
    try {
      const id = req.params.id;
      const session = req.session.user;
      const userData = await users.findOne({ email: session });
      const orderDetails = await order
        .find({ userId: userData._id })
        .sort({ createdAt: -1 });
      const objId = mongoose.Types.ObjectId(id);
      const productData = await order.aggregate([
        {
          $match: { _id: objId },
        },
        {
          $unwind: "$orderItems",
        },
        {
          $project: {
            productItem: "$orderItems.productId",
            productQuantity: "$orderItems.quantity",
            productSize: "$orderItems.size",
            address: 1,
            name: 1,
            phonenumber: 1,
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
            name: 1,
            phoneNumber: 1,
            address: 1,
            productDetail: { $arrayElemAt: ["$productDetail", 0] },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "productDetail.category",
            foreignField: "_id",
            as: "category_name",
          },
        },
        {
          $unwind: "$category_name",
        },
      ]);

      // console.log(orderDetails);

      res.render("user/orderedProduct", {
        productData,
        orderDetails,
        countInCart,
        countInWishlist,
      });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
  cancelOrder: async (req, res) => {
    try {
      const data = req.params.id;
      await order.updateOne(
        { _id: data },
        { $set: { orderStatus: "cancelled" } }
      );
      res.redirect("/orderDetails");
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  getOrders: async (req, res) => {
    try {
      order
        .aggregate([
          {
            $lookup: {
              from: "products",
              localField: "orderItems.productId",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "users",
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ])
        .then((orderDetails) => {
          res.render("admin/orders", { orderDetails });
        });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  getOrderedProduct: async (req, res) => {
    try {
      const id = req.params.id;

      const objId = mongoose.Types.ObjectId(id);
      const productData = await order.aggregate([
        {
          $match: { _id: objId },
        },
        {
          $unwind: "$orderItems",
        },
        {
          $project: {
            productItem: "$orderItems.productId",
            productQuantity: "$orderItems.quantity",
            productSize: "$orderItems.size",
            address: 1,
            name: "$orderItems.size",
            phoneNumber: 1,
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
            productSize: 1,
            address: 1,
            name: 1,
            phoneNumber: 1,
            productDetail: { $arrayElemAt: ["$productDetail", 0] },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "productDetail.category",
            foreignField: "_id",
            as: "category_name",
          },
        },
        {
          $unwind: "$category_name",
        },
      ]);
      res.render("admin/orderedProduct", { productData });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  orderedProduct: async (req, res) => {
    try {
      const id = req.params.id;
      const session = req.session.user;
      const userData = await users.findOne({ email: session });
      const orderDetails = await order
        .find({ userId: userData._id })
        .sort({ createdAt: -1 });
      const objId = mongoose.Types.ObjectId(id);
      const productData = await order.aggregate([
        {
          $match: { _id: objId },
        },
        {
          $unwind: "$orderItems",
        },
        {
          $project: {
            productItem: "$orderItems.productId",
            productQuantity: "$orderItems.quantity",
            productSize: "$orderItems.size",
            address: 1,
            name: 1,
            phonenumber: 1,
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
            name: 1,
            phoneNumber: 1,
            address: 1,
            productDetail: { $arrayElemAt: ["$productDetail", 0] },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "productDetail.category",
            foreignField: "_id",
            as: "category_name",
          },
        },
        {
          $unwind: "$category_name",
        },
      ]);

      // console.log(orderDetails);

      res.render("user/orderedProduct", {
        productData,
        orderDetails,
        countInCart,
        countInWishlist,
      });
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  cancelOrder: async (req, res) => {
    try {
      const data = req.params.id;
      await order.updateOne(
        { _id: data },
        { $set: { orderStatus: "cancelled" } }
      );
      res.redirect("/orderDetails");
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },

  orderStatusChanging: async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body;
      await order.updateOne(
        { _id: id },
        {
          $set: {
            orderStatus: data.orderStatus,
            paymentStatus: data.paymentStatus,
          },
        }
      );
      res.redirect("/admin/order");
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
};
