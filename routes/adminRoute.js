const express = require("express");
const admin_route = express();

const session = require("express-session");
require("dotenv").config();

// session
admin_route.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
}));

// middleware
const adminAuthentication = require('../middleware/adminAuthentication');

// setting view engine and view
admin_route.set('view engine', 'ejs');
admin_route.set('views','./views/admin');

// access controllers
const adminController = require("../controllers/adminController");
const adminCateController = require("../controllers/adminCateController");

// admin login
admin_route.get('/', adminAuthentication.isAdminLogout ,adminController.adminLoad);
admin_route.get('/admin', adminAuthentication.isAdminLogout, adminController.adminLoad);

// admin login verification
admin_route.post('/', adminController.verifyAdminLogin);

// admin home/dashboard
admin_route.get('/adminHome', adminAuthentication.isAdminLogin, adminController.homeLoad);

// products list route
admin_route.get('/productsList', adminAuthentication.isAdminLogin, adminController.productListLoad);

// add product route
admin_route.get('/addProduct', adminAuthentication.isAdminLogin, adminController.addProductLoad)

// add category route
admin_route.get('/addCategory', adminAuthentication.isAdminLogin, adminCateController.addCategoryLoad);
admin_route.post('/addCategory', adminCateController.verifyCategory);
admin_route.get('/editCategory', adminAuthentication.isAdminLogin, adminCateController.editCategory);


// orders route
admin_route.get('/orders', adminAuthentication.isAdminLogin, adminController.ordersLoad);

// customerlist route
admin_route.get('/customerList', adminAuthentication.isAdminLogin, adminController.customerListLoad);
admin_route.get('/blockUser/:userId', adminAuthentication.isAdminLogin, adminController.blockUser);
admin_route.get('/unblockUser/:userId', adminAuthentication.isAdminLogin, adminController.unblockUser);

// admin logout
admin_route.get('/adminLogout', adminAuthentication.isAdminLogin, adminController.adminLogout);


admin_route.get('*', (req,res) => {
    res.redirect("/admin");
});


module.exports = {
    admin_route
}