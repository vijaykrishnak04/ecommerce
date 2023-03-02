const wishlist = require('../model/wishlistSchema')
const user = require('../model/userSchema')
const mongoose = require('mongoose')



const viewWishlist = async (req, res, next) => {
  try {
    let countInWishlist
    const session = req.session.user;
    const userData = await user.findOne({ email: session})
    const userId = userData._id

    const wishlistData = await wishlist
      .aggregate([
        {
          $match: { userId: userId }
        },
        {
          $unwind: "$product",
        },
        {
          $project: {
            productItem: "$product.productId",

          }
        },
        {
          $lookup: {
            from: "products",
            localField: "productItem",
            foreignField: "_id",
            as: "productDetail",
          }
        },
        {
          $project: {
            productItem: 1,
            productDetail: { $arrayElemAt: ["$productDetail", 0] }
          }
        }

      ])
    countInWishlist = wishlistData.length
    res.render('user/wishlist', { wishlistData, countInWishlist })
    console.log(wishlistData);

  } catch (err) {
    console.log(err);
    next(err)
  }

};

const addToWishlist = async (req, res, next) => {
  try {
    const id = req.params.id;
    const objId = id
    const session = req.session.user;

    let proObj = {
      productId: objId,
    };
    const userData = await user.findOne({ email: session});
    const userWishlist = await wishlist.findOne({ userId: userData._id });
    if (userWishlist) {

      let proExist = userWishlist.product.findIndex(
        (product) => product.productId == id
      );
      if (proExist != -1) {

        res.json({ productExist: true });
      } else {

        wishlist.updateOne(
          { userId: userData._id }, { $push: { product: proObj } }
        ).then(() => {
          res.json({ status: true });
        });
      }
    } else {
      const newWishlist = new wishlist({
        userId: userData._id,
        product: [
          {
            productId: objId,

          },
        ],
      });
      newWishlist.save().then(() => {
        res.json({ status: true });
      });
    }

  } catch (err) {
    console.log(err)
    next(err)
  }


};



const removeFromWishlist = async (req, res) => {
  const data = req.body;
  console.log(data);
  const objId = data.productId
  await wishlist.aggregate([
    {
      $unwind: "$product",
    },
  ]);
  await wishlist
    .updateOne(
      { _id: data.wishlistId, "product.productId": objId },
      { $pull: { product: { productId: objId } } }
    )
    .then(() => {
      res.json({ status: true });
    });
};


module.exports = {
  viewWishlist,
  addToWishlist,
  removeFromWishlist
}