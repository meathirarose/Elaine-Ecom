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

// for image
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads"))
    },
    filename: (req, file, cb) => {
        console.log(file);
        const name = Date.now()+'-'+file.originalname;
        cb(null, name);
    }
});

const upload = multer({storage: storage});

// access controllers
const adminController = require("../controllers/adminController");

// admin login routes
admin_route.get('/', adminAuthentication.isAdminLogout ,adminController.adminLoad);
admin_route.get('/admin', adminAuthentication.isAdminLogout, adminController.adminLoad);
admin_route.post('/', adminController.verifyAdminLogin);

// admin home/dashboard
admin_route.get('/adminHome', adminAuthentication.isAdminLogin, adminController.homeLoad);

// products routes
admin_route.get('/productsList', adminAuthentication.isAdminLogin, adminController.productListLoad);
admin_route.get('/addProduct', adminAuthentication.isAdminLogin, adminController.addProductLoad);
admin_route.post('/addProduct', upload.array("prdctImage", 4), adminController.addProduct);
admin_route.get('/listProduct/:prdctId', adminAuthentication.isAdminLogin, adminController.listProduct);
admin_route.get('/unlistProduct/:prdctId', adminAuthentication.isAdminLogin, adminController.unlistProduct);
admin_route.get('/editProduct', adminAuthentication.isAdminLogin, adminController.editProduct);
admin_route.post('/editProduct', adminController.updateProduct);
admin_route.delete('/deleteProductImage', adminAuthentication.isAdminLogin, adminController.deleteProductImage);

// category routes
admin_route.get('/addCategory', adminAuthentication.isAdminLogin, adminController.categoryLoad); 
admin_route.get('/listCategory/:cateId', adminAuthentication.isAdminLogin, adminController.listCategory);
admin_route.get('/unlistCategory/:cateId', adminAuthentication.isAdminLogin, adminController.unlistCategory);
admin_route.post('/addCategory', adminController.addCategory);
admin_route.get('/editCategory', adminAuthentication.isAdminLogin, adminController.editCategory);
admin_route.post('/editCategory', adminController.updateCategory);

// orders route
admin_route.get('/orders', adminAuthentication.isAdminLogin, adminController.ordersLoad);
admin_route.post('/shippedStatusChange/:orderId', adminController.shippedStatusChange);
admin_route.post('/deliveredStatusChange/:orderId', adminController.deliveredStatusChange);

// customerlist routes
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