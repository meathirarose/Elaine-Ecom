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
const userController = require('../controllers/userController');
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

// for google authentication success
user_route.get("/success", authentication.isLogout, userController.successGoogleLogin);

// for google authentication failure
user_route.get("/failure", authentication.isLogin, userController.failureGoogleLogin);

// user signUp route
user_route.get("/userSignup", authentication.isLogout, userController.userSignupLoad);
user_route.post("/userSignup", userController.verifySignup);

// verify otp load route
user_route.get("/verifyOtp", authentication.isLogout, otpController.verifyOtpLoad)
user_route.post("/verifyOtp", otpController.verifyOtp);

// resend otp route
user_route.get("/resendOtp", authentication.isLogout, otpController.resendOtpLoad);
user_route.post("/resendOtp", otpController.verifyResendOtp);

// load home page route
user_route.get("/userHome", authentication.isLogin, accessAuth.accessUser, userController.userHomeLoad);

// load product list route
user_route.get("/products", authentication.isLogin, accessAuth.accessUser, userController.allProductsListLoad);
user_route.get("/productDetails", authentication.isLogin, accessAuth.accessUser, userController.productDetailsLoad);
user_route.get("/addProductsToCart", authentication.isLogin, accessAuth.accessUser, userController.addProductsToCart);
user_route.delete("/deleteCartItem/:productId", authentication.isLogin, accessAuth.accessUser, userController.deleteCartItem);
user_route.post("/updateCartItemQuantity/:productId", authentication.isLogin, accessAuth.accessUser, userController.updateCartQuantity);
user_route.get("/sortProducts", authentication.isLogin, accessAuth.accessUser, userController.sortProducts);

// load cart & checkout
user_route.get("/cart", authentication.isLogin, accessAuth.accessUser, userController.cartLoad);
user_route.get("/checkout", authentication.isLogin, accessAuth.accessUser, userController.checkoutLoad);

// load place order & orderDetails
user_route.post("/placeOrder", userController.placeOrder);
user_route.get("/orderDetails", authentication.isLogin, accessAuth.accessUser, userController.orderDetailsLoad);

// load contact us
user_route.get("/contactUs", authentication.isLogin, accessAuth.accessUser,  userController.contactUsLoad);

// load my account
user_route.get("/myAccount", authentication.isLogin, accessAuth.accessUser, userController.myAccountLoad);
user_route.post("/saveAddress", authentication.isLogin, accessAuth.accessUser, userController.saveAddress);
user_route.delete("/removeAddress", authentication.isLogin, accessAuth.accessUser, userController.removeAddress);
user_route.put("/editAddress/:id", authentication.isLogin, accessAuth.accessUser, userController.editAddress);
user_route.put("/changePassword", authentication.isLogin, accessAuth.accessUser, userController.changePassword);

// user logout route
user_route.get("/userLogout", authentication.isLogin, userController.userLogout);

// page not found
user_route.get("/pageNotFound", authentication.isLogin, userController.pageNotFound);

module.exports = { 
    user_route}
