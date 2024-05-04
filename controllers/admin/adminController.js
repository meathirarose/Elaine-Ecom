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

// sales report load
const salesReportLoad = async (req, res) => {

    try {

        const orderData = await Order.find({});

        // sorting orders
        orderData.sort((a,b) => b.date - a.date);

        // total order amount
        let totalOrderAmount = 0;
        let grandTotal = 0;
        let couponTotal = 0;
        let offerTotal = 0;
        orderData.forEach(total => {
            totalOrderAmount += total.totalAmount;
            grandTotal += totalOrderAmount;
            couponTotal += total.couponDiscount;
            offerTotal += total.offerDiscount;
        });
        console.log(offerTotal);

        // total order count
        const orderCount = orderData.length;

        // total product count
        let productCount = 0;
        orderData.forEach(order =>
            productCount+= order.products.length
        )

        const categoryData = await Category.find({is_listed: true});
        const categoryCount = categoryData.length;

        res.render('salesReport', {
            orderData, 
            totalOrderAmount, 
            orderCount, 
            productCount, 
            categoryCount, 
            grandTotal,
            couponTotal,
            offerTotal
        });

    } catch (error) {
        console.log(error.message);
    }

}

const generateSalesReport = async (req, res) => {

    try {
        

        const reportType = req.body.reportType;
        let startDate, endDate;

        switch(reportType){

            case 'daily': 
                        startDate = new Date();
                        startDate.setDate(startDate.getDate() - 1); 
                        endDate = new Date(startDate); 
                        endDate.setDate(endDate.getDate() + 1); 
                        break;
            

            case 'weekly':
                        startDate = new Date();
                        startDate.setDate(startDate.getDate() - 8);
                        endDate = new Date();
                        endDate.setDate(endDate.getDate() + 1);
                        break;
            
            case 'monthly':
                        startDate = new Date();
                        startDate.setDate(startDate.getMonth() + 1);
                        endDate = new Date();
                        endDate.setDate(endDate.getDate() + 1);
                        break;

            case 'yearly':
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();
                        const previousYearStartDate = new Date(currentYear - 1, currentDate.getMonth(), currentDate.getDate());
                        const currentYearStartDate = new Date(currentYear, currentDate.getMonth(), currentDate.getDate());
                        startDate = previousYearStartDate;
                        startDate.setDate(startDate.getDate() + 1); 
                        endDate = currentYearStartDate;
                        endDate.setDate(endDate.getDate() + 1);  
                        break;           

            case 'custom':
                        startDate = new Date(req.body.startDate);
                        startDate.setDate(startDate.getDate() - 1); 
                        endDate = new Date(req.body.endDate);
                        endDate.setDate(endDate.getDate() + 1);
                        break;
            default:
                    return res.json({ success: false, message: 'Invalid report type' });

        }

        const query = {
            date: { $gte: startDate, $lte: endDate }
        };
        
        const orderData = await Order.find(query);

        res.json({ success: true, orderData });

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
    salesReportLoad,
    generateSalesReport,
    adminLogout

}