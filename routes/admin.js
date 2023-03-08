const express = require('express');
const adminRouter = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const couponController = require('../controllers/couponController')
const verifylogin     = require('../middlewares/session');
const upload = require('../config/multer')
const orderController = require('../controllers/orderController')
const bannerController = require('../controllers/bannerController')
const staffController = require('../controllers/staffController')

//get admin pages

adminRouter.get('/',adminController.getAdminLogin)

adminRouter.get('/home',verifylogin.verifyLoginAdmin,adminController.getAdminHome)

adminRouter.post('/login',adminController.postAdminLogin)

adminRouter.get('/adminLogout',verifylogin.verifyLoginAdmin,adminController.adminLogout)

//user management

adminRouter.get('/addstaff',verifylogin.verifyLoginAdmin,staffController.addStaff)

adminRouter.post('/postAddStaff',verifylogin.verifyLoginAdmin,staffController.postAddStaff)

adminRouter.get('/staffDetails',verifylogin.verifyLoginAdmin,staffController.getAllStaff)

adminRouter.delete('/blockUser/:id',verifylogin.verifyLoginAdmin,staffController.blockStaff)

adminRouter.put('/unblockUser/:id',verifylogin.verifyLoginAdmin,staffController.unblockStaff)

//product management

adminRouter.get('/addProduct',verifylogin.verifyLoginAdmin,productController.addProduct)

adminRouter.post('/postProduct',verifylogin.verifyLoginAdmin,upload.array('image',3),productController.postProduct)

adminRouter.get('/productDetails',verifylogin.verifyLoginAdmin,productController.productDetails)

adminRouter.get('/editProduct/:id',verifylogin.verifyLoginAdmin,productController.editProduct)

adminRouter.post('/postEditproduct/:id',verifylogin.verifyLoginAdmin,productController.postEditProduct)

adminRouter.post('/editimage/:id/:imageId',verifylogin.verifyLoginAdmin,upload.single('images'),productController.imageEdit)

adminRouter.delete('/deleteProduct/:id',verifylogin.verifyLoginAdmin,productController.deleteProduct);

adminRouter.put('/restoreProduct/:id',verifylogin.verifyLoginAdmin,productController.restoreProduct)

//category management

adminRouter.get('/category',verifylogin.verifyLoginAdmin,categoryController.getCategory)

adminRouter.post('/addCategory',verifylogin.verifyLoginAdmin,upload.single('image'),categoryController.addCategory)

adminRouter.post('/editCategory/:id',verifylogin.verifyLoginAdmin,categoryController.editCategory)

adminRouter.get('/deleteCategory/:id',verifylogin.verifyLoginAdmin,categoryController.deleteCategory)

adminRouter.get('/restoreCategory/:id',verifylogin.verifyLoginAdmin,categoryController.restoreCategory)

//coupon management

adminRouter.get('/coupon',verifylogin.verifyLoginAdmin,couponController.getCouponPage);

adminRouter.post('/addCoupon',verifylogin.verifyLoginAdmin,couponController.addCoupon);

adminRouter.post('/editCoupon/:id',verifylogin.verifyLoginAdmin,couponController.editCoupon);

adminRouter.get('/deleteCoupon/:id',verifylogin.verifyLoginAdmin,couponController.deleteCoupon);

adminRouter.get('/restoreCoupon/:id',verifylogin.verifyLoginAdmin,couponController.restoreCoupon);

adminRouter.get('/removeCoupon/:id',verifylogin.verifyLoginAdmin,couponController.removeCoupon)

//order management

adminRouter.get('/order',verifylogin.verifyLoginAdmin,orderController.getOrders)

adminRouter.get('/orderedProduct/:id',verifylogin.verifyLoginAdmin,orderController.getOrderedProduct)

adminRouter.post('/orderStatuschange/:id',orderController.orderStatusChanging)

//banner management

adminRouter.get('/getBanner',verifylogin.verifyLoginAdmin,bannerController.getBannerPage)

adminRouter.post('/addBanner',verifylogin.verifyLoginAdmin,bannerController.addBanner)

adminRouter.post('/editBanner/:id',verifylogin.verifyLoginAdmin,bannerController.editBanner)

adminRouter.get('/deleteBanner/:id',verifylogin.verifyLoginAdmin,bannerController.deleteBanner);

adminRouter.get('/restoreBanner/:id',verifylogin.verifyLoginAdmin,bannerController.restoreBanner);

module.exports = adminRouter;

