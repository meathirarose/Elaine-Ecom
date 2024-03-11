const User = require("../models/userdbModel");
const Category = require("../models/categorydbModel");
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

// load admin home
const homeLoad = async (req, res) => {

    try {

        res.render('adminHome');

    } catch (error) {
        console.log(error.message);
    }

}

// product list load
const productListLoad = async (req, res) => {

    try {

        res.render("productsList");

    } catch (error) {
        console.log(error.message);
    }

}

//add product Load
const addProductLoad = async (req, res) => {

    try {

        res.render("addProduct");

    } catch (error) {
        console.log(error.message);
    }

}

//---------------------------------------------------------category--------------------------------------------------------//
// load add category
const categoryLoad = async (req, res) => {
    try {

        const cateData = await Category.find({});
        res.render("addCategory", { cateData });

    } catch (error) {
        console.log(error.message);
    }
}

// list category
const listCategory = async (req, res) => {

    try {

        const cateId = req.params.cateId;

        await Category.findByIdAndUpdate(cateId, { is_listed: true });
        res.redirect("/admin/addCategory");

    } catch (error) {
        console.log(error.message);
    }

}

//unlisting category
const unlistCategory = async (req, res) => {
    try {
        const cateId = req.params.cateId;

        await Category.findByIdAndUpdate(cateId, { is_listed: false });
        res.redirect("/admin/addCategory");

    } catch (error) {
        console.log(error.message);
    }
}

// add category
const addCategory = async (req, res) => {

    try {
        const cateName = req.body.cateName.trim();
        const cateDescription = req.body.cateDescription;
        const is_listed = req.body.is_listed;
        const lowerCase = cateName.toLowerCase();

        // checking valid category name
        if (!cateName || /^\s*$/.test(cateName)) {
            const cateData = await Category.find({});
            return res.render("addCategory", { cateData, message: "Enter a valid name" });
        }

        const regex = new RegExp("^" + lowerCase + "$", "i");
        const existingCategory = await Category.findOne({ cateName: regex });

        if (existingCategory) {
            const cateData = await Category.find({});
            return res.render("addCategory", { cateData, message: "Category already exist.!" });
        }

        // checking valid category description
        if (!cateDescription || /^\s*$/.test(cateDescription)) {
            const cateData = await Category.find({});
            return res.render("addCategory", { cateData, message: "Enter a valid category" });
        }
        const category = new Category({
            cateName: cateName,
            cateDescription: cateDescription,
            is_listed: is_listed
        });

        const cateData = await category.save();

        if (cateData) {
            const cateData = await Category.find({});
            res.render("addCategory", { cateData, message: "category added successfully" });
        }

    } catch (error) {
        console.log(error.message);
    }

}

// edit category load
const editCategory = async (req, res) => {
    try {

        const id = req.query.id;
        const cateData = await Category.findById({ _id: id });

        if (cateData) {
            res.render("editCategory", { cateData });
        }
        else {
            res.redirect("/admin/addCategory");
        }

    } catch (error) {
        console.log(error.message);
    }
}

// update category
const updateCategory = async (req, res) => {
    try {

        const cateId = req.body.cateId;
        const cateData = await Category.findOne({ _id: cateId });

        const cateName = req.body.cateName.trim();
        const cateDescription = req.body.cateDescription.trim();
        const lowerCase = cateName.toLowerCase();

        // checking valid category name
        if (!cateName || /^\s*$/.test(cateName)) {
            return res.render("editCategory", { cateData, message: "Enter a valid name" });
        }

        const regex = new RegExp("^" + lowerCase + "$", "i");
        const existingCategory = await Category.findOne({ cateName: regex });

        if (existingCategory && existingCategory._id.toString() !== cateId) {
            return res.render("editCategory", { cateData, message: "Category already exist.!" });
        }

        // checking valid category description
        if (!cateDescription || /^\s*$/.test(cateDescription)) {
            const cateData = await Category.find({});
            return res.render("editCategory", { cateData, message: "Enter a valid category" });
        }

        await Category.findByIdAndUpdate({ _id: cateId }, { $set: { cateName: req.body.cateName, cateDescription: req.body.cateDescription } })
        res.redirect("/admin/addCategory");

    } catch (error) {
        console.log(error.message);
    }

}
//-------------------------------------------------------end-category------------------------------------------------------//
//----------------------------------------------------------orders---------------------------------------------------------//
// orders load
const ordersLoad = async (req, res) => {

    try {

        res.render("orders");

    } catch (error) {
        console.log(error.message);
    }

}
//--------------------------------------------------------end-orders-------------------------------------------------------//
//---------------------------------------------------------customers-------------------------------------------------------//
//customer List Load
const customerListLoad = async (req, res) => {

    try {
        const userData = await User.find({});
        res.render("customerList", { userData });

    } catch (error) {
        console.log(error.message);
    }

}

// blocking user
const blockUser = async (req, res) => {
    try {

        const userId = req.params.userId;

        await User.findByIdAndUpdate(userId, { is_blocked: true });
        res.redirect("/admin/customerList");

    } catch (error) {
        console.log(error.message);
    }
}

//unblocking user
const unblockUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        await User.findByIdAndUpdate(userId, { is_blocked: false });
        res.redirect("/admin/customerList");

    } catch (error) {
        console.log(error.message);
    }
}
//------------------------------------------------------end-customers------------------------------------------------------//
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
    categoryLoad,
    listCategory,
    unlistCategory,
    addCategory,
    editCategory,
    updateCategory,
    ordersLoad,
    customerListLoad,
    blockUser,
    unblockUser,
    addProductLoad,
    adminLogout

}