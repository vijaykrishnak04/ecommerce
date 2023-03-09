const cart = require("../model/cartSchema");
const users = require("../model/userSchema");
const order = require("../model/orderSchema");
const coupon = require("../model/couponSchema");
const requests = require('../model/requestSchema')
const products = require("../model/productSchema");
const moment = require("moment");
const mongoose = require("mongoose");
const promise = require("promise");
const instance = require("../config/razorpay");
const crypto = require('crypto');


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
  getCheckOutPage: async (req, res, next) => {
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
      next(error)
    }
  },

  fetchAddress: async (req, res, next) => {
    try {
      const addressId = req.params.userId
      const session = req.session.user
      const userData = await users.findOne({ email: session })
      const addressDetails = userData.addressDetails.id(addressId);
      if (!addressDetails) {
        return res.status(404).json({ message: 'Address not found' })
      }
      res.json(addressDetails)
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'internal server error' })
      next(err)
    }
  },

  placeOrder: async (req, res, next) => {
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
              phone: req.body.phone,
              houseName: req.body.housename,
              area: req.body.area,
              landMark: req.body.landMark,
              district: req.body.district,
              state: req.body.state,
              postOffice: req.body.postOffice,
              pin: req.body.pincode,
              orderItems: cartData.product,
              totalAmount: total,
              paymentMethod: req.body.paymentMethod,
              orderDate: moment().format("MMM Do YY"),
              deliveryDate: moment().add(3, "days").format("MMM Do YY")
            })



            if (req.body.paymentMethod === "COD") {

              const orderDatas = await orderData.save()
              const orderId = orderDatas._id

              await order.updateOne({ _id: orderId }, { $set: { orderStatus: 'Placed' } }).then(async () => {

                res.json({ success: true });

                coupon.updateOne(
                  { couponName: data.coupon },
                  { $push: { users: { userId: objId } } }
                )

                const result = await Promise.all(
                  productData.map(async (x) => {
                    const updatedProduct = await products.updateOne(
                      { _id: x.productItem },
                      { $inc: { stock: -1 * x.productQuantity } }
                    );
                    return updatedProduct;
                  })
                );

              })

            } else if (req.body.paymentMethod === "Wallet") {

              if (userData.walletTotal < orderData.totalAmount) {

                res.json({ wallet: true })

              } else {

                const orderDatas = await orderData.save()
                const orderId = orderDatas._id

                order.updateOne({ _id: orderId }, { $set: { paymentStatus: "Paid", orderStatus: 'Placed' } }).then(async () => {

                  const updatedWalletTotal = userData.walletTotal - orderDatas.totalAmount;
                  const updatedWalletDetails = userData.walletDetails.concat({
                    transactionType: 'Purchase',
                    amount: orderDatas.totalAmount,
                    orderDetails: orderData._id,
                    date: new Date()
                  });

                  await users.updateOne(
                    { _id: userData._id },
                    { $set: { walletTotal: updatedWalletTotal, walletDetails: updatedWalletDetails } }
                  );

                  res.json({ success: true });
                  coupon.updateOne(
                    { couponName: data.coupon },
                    { $push: { users: { userId: objId } } }
                  )

                }).catch((err) => {
                  console.log(err);
                  res.json({ status: false, err_message: "Payment failed" });
                  order.deleteOne({ _id: orderId })
                })

              }

            } else if (req.body.paymentMethod = "Wallet and Online") {

              const orderDatas = await orderData.save()
              const orderId = orderDatas._id

              const updatedWalletTotal = 0;
              const updatedWalletDetails = userData.walletDetails.concat({
                transactionType: 'Purchase',
                amount: userData.walletTotal,
                orderDetails: orderData._id,
                date: new Date()
              });

              await users.updateOne(
                { _id: userData._id },
                { $set: { walletTotal: updatedWalletTotal, walletDetails: updatedWalletDetails } }
              );

              let balance = orderDatas.totalAmount - userData.walletTotal
              const amount = balance * 100

              let options = {
                amount: amount,
                currency: "INR",
                receipt: "" + orderId,
              };
              instance.orders.create(options, function (err, order) {
                if (err) {
                  console.log(err);
                } else {
                  res.json({ order: order });
                  coupon.updateOne(
                    { couponName: data.coupon },
                    { $push: { users: { userId: objId } } }
                  ).then((updated) => {
                    console.log(updated);
                  });
                }
              })

            } else {

              const orderDatas = await orderData.save()
              const orderId = orderDatas._id
              const amount = orderDatas.totalAmount * 100

              let options = {
                amount: amount,
                currency: "INR",
                receipt: "" + orderId,
              };
              instance.orders.create(options, function (err, order) {
                if (err) {
                  console.log(err);
                } else {
                  res.json({ order: order });
                  coupon.updateOne(
                    { couponName: data.coupon },
                    { $push: { users: { userId: objId } } }
                  ).then((updated) => {
                    console.log(updated);
                  });
                }
              })
            }
          } else {
            res.redirect("/viewCart");
          }
        }
      }
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  verifyPayment: async (req, res, next) => {
    try {
      const details = req.body;
      const orderId = details['payment[razorpay_order_id]'];
      const paymentId = details['payment[razorpay_payment_id]'];
      const razorpay_signature = details['payment[razorpay_signature]'];
      const receipt = details['order[receipt]'];
      const objId = mongoose.Types.ObjectId(receipt);

      let hmac = crypto.createHmac("SHA256", process.env.KETSECRET);
      hmac.update(orderId + "|" + paymentId);
      hmac = hmac.digest("hex");

      if (hmac == razorpay_signature) {

        order.updateOne({ _id: objId }, { $set: { paymentStatus: "Paid", orderStatus: 'Placed' } }).then(() => {

          res.json({ success: true });

        }).catch((err) => {
          console.log(err);
          res.json({ status: false, err_message: "payment failed" });
          order.findByIdAndDelete({ _id: objId })
        })

      } else {

        console.log(err);
        res.json({ status: false, err_message: "payment failed" });
        order.findByIdAndDelete({ _id: objId })

      }


    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  orderSuccess: async (req, res, next) => {
    try {
      res.render("user/orderSuccess", { countInCart, countInWishlist });
      console.log(req.session.user);
      const userId = await users.findOne({ email: req.session.user }, { userId: 1 })
      const cartId = mongoose.Types.ObjectId(userId)
      await cart.deleteOne({ userId: cartId });
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  orderDetails: async (req, res, next) => {
    try {
      const session = req.session.user;
      const userData = await users.findOne({ email: session });
      const userId = userData._id;
      const objId = mongoose.Types.ObjectId(userId);
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
      res.render("user/orderDetails", {
        productData,
        orderDetails,
        countInCart,
        countInWishlist,
      });
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  orderedProduct: async (req, res, next) => {
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

      res.render("user/orderedProduct", {
        productData,
        orderDetails,
        countInCart,
        countInWishlist,
      });
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  getOrders: async (req, res, next) => {
    const status = null
    try {
      order
        .aggregate([
          {
            $match: {
              orderStatus: {
                $nin: ["delivered", "cancelled"]
              }
            },
          },
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
          res.render("admin/orders", { orderDetails, status });
        });
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  getDeliveredOrders: async (req, res, next) => {
    const status = "Delivered"
    try {
      order
        .aggregate([
          {
            $match: {
              orderStatus: "delivered"
            },
          },
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
          res.render("admin/orders", { orderDetails, status });
        });
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  getCancelledOrders: async (req, res, next) => {
    const status = "Cancelled"
    try {
      order
        .aggregate([
          {
            $match: {
              orderStatus: "cancelled"
            },
          },
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
          res.render("admin/orders", { orderDetails, status });
        });
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  getOrderedProduct: async (req, res, next) => {
    try {
      const id = req.params.id;

      const objId = mongoose.Types.ObjectId(id);

      const orderDetails = await order.find({ _id: objId })
      console.log(orderDetails);

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
      res.render("admin/orderedProduct", { productData, orderDetails });
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  cancelOrder: async (req, res, next) => {
    try {

      const orderId = req.body.orderId
      requests.create({

        order: orderId,
        message: req.body.reason

      }).then(async () => {

        await order.updateOne({ _id: orderId }, { $set: { orderStatus: "Requested to cancel" } })
        res.redirect('/orderDetails')

      })


    } catch (error) {
      console.log(error);
      next(error)
    }

  },

  getRequests: async (req, res, next) => {
    try {
      const requestData = await requests.find({status:{$ne:"accepted"}}).populate("order")
      console.log(requestData);
      res.render('admin/requests', { requestData })
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  acceptCancel: async (req, res, next) => {
    try {
      const data = req.params.id;
      const orderData = await order.findOne({ _id: data })
      const userData = await users.findOne({ _id: orderData.userId });

      if (orderData.paymentStatus == "Paid") {
        const refundAmount = orderData.totalAmount
        const updatedWalletTotal = userData.walletTotal + refundAmount;
        const updatedWalletDetails = userData.walletDetails.concat({
          transactionType: 'refund',
          amount: refundAmount,
          orderDetails: orderData._id,
          date: new Date()
        });

        await users.updateOne(
          { _id: orderData.userId },
          { $set: { walletTotal: updatedWalletTotal, walletDetails: updatedWalletDetails } }
        );
        res.redirect("/admin/requests");
      }

      await order.updateOne({ _id: data }, { $set: { orderStatus: "cancelled" } })
      await requests.updateOne({ order: data },{$set:{status:"accepted"}})
      res.redirect("/admin/requests");

    } catch (error) {
      console.log(error);
      next(error)
    }

  },

  orderStatusChanging: async (req, res, next) => {
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
      next(error)
    }
  },
};
