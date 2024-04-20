const User = require("../../models/userdbModel");
const Order = require("../../models/orderdbSchema");
const Category = require("../../models/categorydbModel");
const bcrypt = require("bcrypt");

//-----------------------------------------------admin-login-and-verification----------------------------------------------//
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

// load admin home
const homeLoad = async (req, res) => {

    try {

        const orderData = await Order.find({});

        // sorting orders
        orderData.sort((a,b) => b.date - a.date);

        // total order amount
        let totalOrderAmount = 0;
        orderData.forEach(total => 
            totalOrderAmount += total.totalAmount
        )

        // total order count
        const orderCount = orderData.length;

        // total product count
        let productCount = 0;
        orderData.forEach(order =>
            productCount+= order.products.length
        )

        const categoryData = await Category.find({is_listed: true});
        const categoryCount = categoryData.length;

        res.render('adminHome', {orderData, totalOrderAmount, orderCount, productCount, categoryCount});

    } catch (error) {
        console.log(error.message);
    }
}

// sales report
const generateSalesReport = async (req, res) => {

    try {

        const orderData = await Order.find({});

        // sorting orders
        orderData.sort((a,b) => b.date - a.date);

        // total order amount
        let totalOrderAmount = 0;
        orderData.forEach(total => 
            totalOrderAmount += total.totalAmount
        )

        // total order count
        const orderCount = orderData.length;

        // total product count
        let productCount = 0;
        orderData.forEach(order =>
            productCount+= order.products.length
        )

        const categoryData = await Category.find({is_listed: true});
        const categoryCount = categoryData.length;

        res.render('salesReport', {orderData, totalOrderAmount, orderCount, productCount, categoryCount});

    } catch (error) {
        console.log(error.message);
    }

}


//---------------------------------------------end-admin-login-and-verification--------------------------------------------//

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
    generateSalesReport,
    adminLogout

}