var express      = require('express');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const wishlistController = require('../controllers/wishlistController')
const contactController = require('../controllers/contactController')
const router = express() 
const verifyLogin= require("../middlewares/session");

 
router.use(express.json());
router.use(express.urlencoded({extended:true}));

router.get('/',userController.getHome);

// router.get('/',verifyLogin.verifyLoginUser,userController.getHome);

router.get('/login',verifyLogin.verifyNotLoginUser,userController.getLogin);

router.post('/login',userController.postLogin);

router.get('/logout',verifyLogin.verifyLoginUser,userController.userLogout)

router.get('/signup',verifyLogin.verifyNotLoginUser,userController.getSignup);

router.post('/signup',userController.postSignup);

router.post('/otp', userController.postOtp);

router.get('/forgotPassword',userController.forgotPassword)

router.post('/forgotPassword',userController.postForgotPassword);

router.post('/postForgotOtp',userController.postForgotOtp);

router.post('/postChangePassword',userController.postChangePassword);

//search product

router.post('/searchProduct',productController.searchProduct);

//get contact page

router.get('/contact',contactController.getContact)

//profile management

router.get('/viewProfile',verifyLogin.verifyLoginUser,userController.viewProfile);

router.get('/editProfile',verifyLogin.verifyLoginUser,userController.editProfile);

router.post('/postEditProfile',userController.postEditProfile);

router.get('/editPassword',verifyLogin.verifyLoginUser,userController.getResetpassword)

router.post('/postEditPassword',verifyLogin.verifyLoginUser,userController.postResetPassword)

//product view

router.get('/shop',productController.getShopPage);

router.get('/category/:id',productController.getCategoryWisePage); 

router.get('/productView/:id',productController.getProductViewPage);

//wishlist manage

router.get('/viewWishlist',verifyLogin.verifyLoginUser,wishlistController.viewWishlist)

router.get('/wishList/:id',verifyLogin.verifyLoginUser,wishlistController.addToWishlist);

router.post('/removeFromWishlist',verifyLogin.verifyLoginUser,wishlistController.removeFromWishlist);

//cart manage

router.get('/viewcart',verifyLogin.verifyLoginUser,cartController.viewCart);

router.get('/cart/:id',verifyLogin.verifyLoginUser,cartController.addToCart)

router.post('/removeProduct',verifyLogin.verifyLoginUser, cartController.removeProduct);

router.post('/changeQuantity',verifyLogin.verifyLoginUser,cartController.changeQuantity);

//checkout page and order management

router.post('/addNewAddress', userController.addNewAddress); 

router.post("/placeOrder", verifyLogin.verifyLoginUser,orderController.placeOrder);

router.get('/checkout',verifyLogin.verifyLoginUser,orderController.getCheckOutPage);

router.post("/verifyPayment",verifyLogin.verifyLoginUser,orderController.verifyPayment);

router.get('/orderSuccess',verifyLogin.verifyLoginUser,orderController.orderSuccess)

router.get('/orderDetails', verifyLogin.verifyLoginUser,orderController.orderDetails);

router.get('/orderedProduct/:id',verifyLogin.verifyLoginUser,orderController.orderedProduct);

router.post('/cancelOrder',verifyLogin.verifyLoginUser,orderController.cancelOrder);

router.get('/getAddressDetails/:userId',verifyLogin.verifyLoginUser,orderController.fetchAddress)

module.exports = router;
