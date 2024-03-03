const express = require("express");
const user_route = express();
const session = require('express-session');

// session secret
const config = require('../config/config');

// session
user_route.use(session({secret:config.sessionSecret}));

// middleware
const authentication = require("../middleware/userAuthentication");

// set view engine and view
user_route.set('view engine','ejs');
user_route.set('views','./views/user');

// require user controller
const userController = require('../controllers/userController');

// user login route
user_route.get("/userLogin", authentication.isLogout, userController.userLoginLoad);
user_route.post("/userLogin", userController.verifyLogin)

// user signUp route
user_route.get("/", authentication.isLogout, userController.userLoadPage);
user_route.get("/userSignup", authentication.isLogout, userController.userSignupLoad);
user_route.post("/userSignup", userController.verifySignup);

// load home page
user_route.get("/userHome", authentication.isLogin, userController.userHomeLoad);





module.exports = { 
    user_route}
