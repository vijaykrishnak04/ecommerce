var express      = require('express');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController')
const router = express() 
const verifyLogin= require("../middlewares/session");

 
router.use(express.json());
router.use(express.urlencoded({extended:true}));

router.get('/',userController.getHome);

router.get('/',verifyLogin.verifyLoginUser,userController.getHome);

router.get('/login',verifyLogin.verifyNotLoginUser,userController.getLogin);

router.post('/login',userController.postLogin);

router.get('/logout',verifyLogin.verifyLoginUser,userController.userLogout)

router.get('/signup',verifyLogin.verifyNotLoginUser,userController.getSignup);

router.post('/signup',userController.postSignup);

router.get('/otpPage', userController.getOtpPage);

router.post('/otp', userController.postOtp);

router.get('/forgotPassword',userController.forgotPassword)

router.post('/forgotPassword',userController.postForgotPassword);

router.post('/postForgotOtp',userController.postForgotOtp);

router.post('/postChangePassword',userController.postChangePassword);

//profile management

router.get('/viewProfile',verifyLogin.verifyLoginUser,userController.viewProfile);

router.get('/editProfile',userController.editProfile);

router.post('/postEditProfile',userController.postEditProfile) 


//product view

router.get('/shop',productController.getShopPage);

router.get('/category/:id',productController.getCategoryWisePage); 

router.get('/productView/:id',productController.getProductViewPage);

//cart manage

router.get('/viewcart',verifyLogin.verifyLoginUser,productController.viewCart);

router.get('/cart/:id',verifyLogin.verifyLoginUser,productController.addToCart)

router.post('/removeProduct', productController.removeProduct);

router.post('/changeQuantity',productController.changeQuantity);

// router.post('/changeQuantity',productController.changeQuantity);


module.exports = router;
