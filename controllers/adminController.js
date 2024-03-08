const User = require("../models/userdbModel");
const bcrypt = require("bcrypt");

// admin login
const adminLoad = async (req, res) => {

    try {

        res.render('adminLogin');

    } catch (error) {
        console.log(error.message);
    }
}

// verify admin login
const verifyAdminLogin = async (req, res) => {

    try {

        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {

            const passMatch = await bcrypt.compare(password, userData.password);
            if (passMatch) {

                if (userData.is_admin === 0) {

                    res.render('adminLogin', { message: "You are not admin..!" })

                } else {

                    req.session.admin_id = userData._id;

                    res.redirect('/admin/adminHome');
                }

            } else {

                res.render('adminLogin', { message: "email and password incorrect" });
            }
        } else {

            res.render('adminLogin', { message: "email and password incorrect" });
        }

    } catch (error) {
        console.log(error.message);
    }

}

// load admin home/dashboard
const homeLoad = async (req, res) => {

    try {
        
        res.render('adminHome');

    } catch (error) {
        console.log(error.message);
    }

}

// product list load
const productListLoad = async (req, res) =>{

    try {
       
        res.render("productsList");

    } catch (error) {
        console.log(error.message);
    }

}

// orders load
const ordersLoad = async (req, res) => {

    try {

        res.render("orders");

    } catch (error) {
        console.log(error.message);
    }

}

//customer List Load
const customerListLoad = async (req, res) => {
    
    try {
        const userData = await User.find({});
        res.render("customerList", {userData});

    } catch (error) {
        console.log(error.message);
    }

}

//customer List Load
const addProductLoad = async (req, res) => {
    
    try {
        
        res.render("addProduct");

    } catch (error) {
        console.log(error.message);
    }

}

const adminLogout = async (req, res) => {

    try {

        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    adminLoad,
    verifyAdminLogin,
    homeLoad,
    productListLoad,
    ordersLoad,
    customerListLoad,
    addProductLoad,
    adminLogout
    
}