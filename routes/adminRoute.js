const express = require("express");
const admin_route = express();
const path = require("path");

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
const adminController = require("../controllers/admin/adminController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController");
const orderController = require("../controllers/admin/orderController");
const userController = require("../controllers/admin/userController");

// admin login routes
admin_route.get('/', adminAuthentication.isAdminLogout ,adminController.adminLoad);
admin_route.get('/admin', adminAuthentication.isAdminLogout, adminController.adminLoad);
admin_route.post('/', adminController.verifyAdminLogin);

// admin home/dashboard
admin_route.get('/adminHome', adminAuthentication.isAdminLogin, adminController.homeLoad);

// products routes
admin_route.get('/productsList', adminAuthentication.isAdminLogin, productController.productListLoad);
admin_route.get('/addProduct', adminAuthentication.isAdminLogin, productController.addProductLoad);
admin_route.post('/addProduct', productController.uploadOriginal.array("prdctImage", 4), productController.addProduct);
admin_route.get('/listProduct/:prdctId', adminAuthentication.isAdminLogin, productController.listProduct);
admin_route.get('/unlistProduct/:prdctId', adminAuthentication.isAdminLogin, productController.unlistProduct);
admin_route.get('/editProduct', adminAuthentication.isAdminLogin, productController.editProduct);
admin_route.post('/editProduct', productController.updateProduct);
admin_route.delete('/deleteProductImage', adminAuthentication.isAdminLogin, productController.deleteProductImage);
admin_route.put('/uploadProductImages', productController.uploadOriginal.array("prdctImage", 4), productController.editProductImages);

// category routes
admin_route.get('/addCategory', adminAuthentication.isAdminLogin, categoryController.categoryLoad); 
admin_route.get('/listCategory/:cateId', adminAuthentication.isAdminLogin, categoryController.listCategory);
admin_route.get('/unlistCategory/:cateId', adminAuthentication.isAdminLogin, categoryController.unlistCategory);
admin_route.post('/addCategory', categoryController.addCategory);
admin_route.get('/editCategory', adminAuthentication.isAdminLogin, categoryController.editCategory);
admin_route.post('/editCategory', categoryController.updateCategory);

// orders route
admin_route.get('/orders', adminAuthentication.isAdminLogin, orderController.ordersLoad);
admin_route.post('/shippedStatusChange/:orderId', orderController.shippedStatusChange);
admin_route.post('/deliveredStatusChange/:orderId', orderController.deliveredStatusChange);
admin_route.post('/cancelledStatusChange/:orderId', orderController.cancelledStatusChange);

// customerlist routes
admin_route.get('/customerList', adminAuthentication.isAdminLogin, userController.customerListLoad);
admin_route.get('/blockUser/:userId', adminAuthentication.isAdminLogin, userController.blockUser);
admin_route.get('/unblockUser/:userId', adminAuthentication.isAdminLogin, userController.unblockUser);

// admin logout
admin_route.get('/adminLogout', adminAuthentication.isAdminLogin, adminController.adminLogout);

admin_route.get('*', (req,res) => {
    res.redirect("/admin");
});


module.exports = {
    admin_route
}