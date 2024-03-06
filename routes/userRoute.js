const express = require("express");
const user_route = express();
const session = require('express-session');
require("dotenv").config();


// session secret
// const config = require('../config/config');

// session
user_route.use(session({secret:process.env.SESSION_SECRET}));

// middleware
const authentication = require("../middleware/userAuthentication");

// set view engine and view
user_route.set('view engine','ejs');
user_route.set('views','./views/user');

// requiring controllers
const userController = require('../controllers/userController');
const otpController = require("../controllers/otpController");

// user load page route
user_route.get("/", authentication.isLogout, userController.userLoadPage);

// user login route
user_route.get("/userLogin", authentication.isLogout, userController.userLoginLoad);
user_route.post("/userLogin", userController.verifyLogin)

// user signUp route
user_route.get("/userSignup", authentication.isLogout, userController.userSignupLoad);
user_route.post("/userSignup", userController.verifySignup);

// verify otp load route
user_route.get("/verifyOtp", authentication.isLogout, otpController.verifyOtpLoad)
user_route.post("/verifyOtp", otpController.verifyOtp);

// resend otp route
user_route.get("/resendOtp", authentication.isLogout, otpController.resendOtp);

// load home page route
user_route.get("/userHome", authentication.isLogin, userController.userHomeLoad);

// user logout route
user_route.get("/userLogout", authentication.isLogin, userController.userLogout);



module.exports = { 
    user_route}
