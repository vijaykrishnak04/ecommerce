const cart = require("../model/cartSchema");
const users = require("../model/userSchema");
const products = require("../model/productSchema");
const order = require("../model/orderSchema");
const coupon = require("../model/couponSchema");
const moment = require("moment");
const mongoose = require("mongoose");
const promise = require("promise");

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
  },
  placeOrder: async (req, res) => {
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

          if (req.body.paymentMethod === "COD") {
            const orderDatas = await orderData.save();
            const orderId = orderDatas._id;

            await order.updateOne(
              { _id: orderId },
              { $set: { orderStatus: "placed" } }
            );
            await cart.deleteOne({ userId: userData._id });
            res.redirect("/orderSuccess");
            await coupon.updateOne(
              { couponName: data.coupon },
              { $push: { users: { userId: objId } } }
            );
          } else {
            const orderDatas = await orderData.save();
            const orderId = orderDatas._id;

            const session = await stripe.checkout.sessions.create({
              payment_method_types: ["card"],
              line_items: productData.map((ele) => {
                return {
                  price_data: {
                    currency: "inr",
                    product_data: {
                      name: ele.productDetail.name,
                    },
                    unit_amount: ele.productDetail.price * 100,
                  },
                  quantity: ele.productQuantity,
                };
              }),
              mode: "payment",
              success_url: `${process.env.SERVER_URL}/orderSuccess?cartId=${userData._id}&orderId=${orderId}`,
              cancel_url: `${process.env.SERVER_URL}/checkout?orderId=${orderId}`,
            });
            console.log(session);
            res.json({ url: session.url });
          }
        } else {
          res.redirect("/viewCart");
        }
      }
    }
  },

  orderSuccess: async (req, res) => {
    const query = req.query;
    const orderId = query.orderId;
    await order.updateOne(
      { _id: orderId },
      { $set: { orderStatus: "placed", paymentStatus: "paid" } }
    );
    await cart.deleteOne({ userId: query.cartId });

    res.render("user/orderSuccess", { countInCart, countInWishlist });
  },
  orderDetails: async (req, res) => {
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
  },
  orderedProduct: async (req, res) => {
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
  },
  cancelOrder: async (req, res) => {
    const data = req.params.id;
    await order.updateOne(
      { _id: data },
      { $set: { orderStatus: "cancelled" } }
    );
    res.redirect("/orderDetails");
  },

  getOrders: async (req, res) => {
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
  },

  getOrderedProduct: async (req, res) => {
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
  },

  orderedProduct: async (req, res) => {
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
  },

  cancelOrder: async (req, res) => {
    const data = req.params.id;
    await order.updateOne(
      { _id: data },
      { $set: { orderStatus: "cancelled" } }
    );
    res.redirect("/orderDetails");
  },
};
