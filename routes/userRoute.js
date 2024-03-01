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
user_route.get("/", authentication.isLogout, userController.userLoginLoad);
user_route.get("/userLoginSignup", authentication.isLogout, userController.userLoginLoad);

user_route.post("/userLoginSignup", userController.verifyLogin)

// user signUp route
user_route.get("/userLoginSignup", authentication.isLogout, userController.userSignupLoad);
user_route.post("/userHome", userController.verifySignup)





module.exports = { 
    user_route}
