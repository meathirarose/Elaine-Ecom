const express = require("express");
const user_route = express();
const session = require('express-session');
require("dotenv").config();
const passport = require("passport");
require("../auth/passport");

// session
user_route.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
}));

// passport google authentication
user_route.use(passport.initialize());
user_route.use(passport.session());

// authentication middleware
const authentication = require("../middleware/userAuthentication");
const accessAuth = require("../middleware/accessAuthentication");

// set view engine and view
user_route.set('view engine','ejs');
user_route.set('views','./views/user');

// requiring controllers
const userController = require('../controllers/user/userController');
const cartController = require('../controllers/user/cartController');
const orderController = require('../controllers/user/orderController');
const productController = require('../controllers/user/productController');
const wishlistController = require('../controllers/user/wishlistController');
const otpController = require("../auth/otpMailVerify");
const forgotPasswordController = require("../auth/forgotPassword");

// user load page route
user_route.get("/", authentication.isLogout, userController.userLoadPage);

// user login route
user_route.get("/userLogin", authentication.isLogout, userController.userLoginLoad);
user_route.post("/userLogin", userController.verifyLogin);

// forgot password
user_route.get("/forgotPasswordEmail", authentication.isLogout, forgotPasswordController.forgotPasswordEmailLoad);
user_route.post("/forgotPasswordEmail", forgotPasswordController.verifyForgotEmail);
user_route.get("/verifyOtpForgot", authentication.isLogout, forgotPasswordController.verifyOtpForgotLoad);
user_route.post("/verifyOtpForgot", forgotPasswordController.verifyOtpForgot);
user_route.get("/forgotPassword", authentication.isLogout, forgotPasswordController.forgotPasswordLoad);
user_route.post("/forgotPassword", forgotPasswordController.updatePassword);

// google authentication
user_route.get("/google", authentication.isLogout, passport.authenticate("google", {
    scope: ["email", "profile"]
}));

// google authentication callback
user_route.get("/auth/google/callback", authentication.isLogout, passport.authenticate("google", {
    successRedirect: "/success",
    failureRedirect: "/failure"
}));

// user google authentication routes
user_route.get("/success", authentication.isLogout, userController.successGoogleLogin);
user_route.get("/failure", authentication.isLogin, userController.failureGoogleLogin);

// user routes
user_route.get("/userSignup", authentication.isLogout, userController.userSignupLoad);
user_route.post("/userSignup", userController.verifySignup);
user_route.get("/userHome", authentication.isLogin, accessAuth.accessUser, userController.userHomeLoad);

// otp routes
user_route.get("/verifyOtp", authentication.isLogout, otpController.verifyOtpLoad)
user_route.post("/verifyOtp", otpController.verifyOtp);
user_route.get("/resendOtp", authentication.isLogout, otpController.resendOtpLoad);
user_route.post("/resendOtp", otpController.verifyResendOtp);

// product routes
user_route.get("/products", authentication.isLogin, accessAuth.accessUser, productController.allProductsListLoad);
user_route.get("/productDetails", authentication.isLogin, accessAuth.accessUser, productController.productDetailsLoad);
user_route.post("/sortingProducts", productController.sortProducts);
user_route.post("/filterProducts", productController.filterProducts);

// cart routes
user_route.get("/cart", authentication.isLogin, accessAuth.accessUser, cartController.cartLoad);
user_route.get("/addProductsToCart", authentication.isLogin, accessAuth.accessUser, cartController.addProductsToCart);
user_route.delete("/deleteCartItem/:productId", authentication.isLogin, accessAuth.accessUser, cartController.deleteCartItem);
user_route.post("/updateCartItemQuantity/:productId", cartController.updateCartQuantity);

//wishlist routes
user_route.get("/wishlist", authentication.isLogin, accessAuth.accessUser, wishlistController.wishlistLoad);
user_route.get("/addToWishlist", authentication.isLogin, accessAuth.accessUser, wishlistController.addToWishlist);
user_route.delete("/removeFromWishlist", authentication.isLogin, accessAuth.accessUser, wishlistController.deleteWishlistItem);

// order routes
user_route.get("/checkout", authentication.isLogin, accessAuth.accessUser, orderController.checkoutLoad);
user_route.post("/placeOrder", orderController.placeOrder);
user_route.get("/orderDetails", authentication.isLogin, accessAuth.accessUser, orderController.orderDetailsLoad);
user_route.post("/generateInvoice", orderController.generateInvoice);
user_route.post("/cancelProduct", orderController.cancelProduct);
user_route.get("/orderSuccess", authentication.isLogin, accessAuth.accessUser, orderController.orderSuccessLoad);
user_route.post("/razorpayOrder", orderController.createRazorpayOrder);
user_route.post("/addCoupon", orderController.addCoupon);

// load contact us
user_route.get("/contactUs", authentication.isLogin, accessAuth.accessUser, userController.contactUsLoad);

// user routes on myAccount page
user_route.get("/myAccount", authentication.isLogin, accessAuth.accessUser, userController.myAccountLoad);
user_route.post("/saveAddress", userController.saveAddress);
user_route.delete("/removeAddress", authentication.isLogin, accessAuth.accessUser, userController.removeAddress);
user_route.put("/editAddress/:id", authentication.isLogin, accessAuth.accessUser, userController.editAddress);
user_route.put("/userProfile", authentication.isLogin, accessAuth.accessUser, userController.editUserProfile);
user_route.put("/changePassword", authentication.isLogin, accessAuth.accessUser, userController.changePassword);

// user logout route
user_route.get("/userLogout", authentication.isLogin, userController.userLogout);

// page not found
user_route.get("/pageNotFound", authentication.isLogin, userController.pageNotFound);

module.exports = { 
    user_route}
