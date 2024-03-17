const User = require("../models/userdbModel");
const Category = require("../models/categorydbModel");
const Product = require("../models/productdbModel");
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

        res.render('adminHome');

    } catch (error) {
        console.log(error.message);
    }
}

//---------------------------------------------end-admin-login-and-verification--------------------------------------------//
//---------------------------------------------------------products--------------------------------------------------------//
// product list load
const productListLoad = async (req, res) => {

    try {

        const prdctData = await Product.find();
        const cateData = await Category.find({});
        res.render("productsList", { prdctData, cateData });

    } catch (error) {
        console.log(error.message);
    }

}

// adding products
const addProduct = async (req, res) => {

    try {

        const cateData = await Category.find({});

        const prdctName = req.body.prdctName.trim();
        const prdctDescription = req.body.prdctDescription.trim();
        const prdctPrice = req.body.prdctPrice;
        const prdctQuantity = req.body.prdctQuantity;
        const imgFiles = req.files;
        const cateName = req.body.cateId;

        // checking valid product name / space check
        if (!prdctName || /^\s*$/.test(prdctName)) {
            const prdctData = await Product.find({});
            return res.render("addProduct", { prdctData, cateData, message: "Enter a valid product name" });
        }

        // checking valid category description / space check
        if (!prdctDescription || /^\s*$/.test(prdctDescription)) {
            const prdctData = await Product.find({});
            return res.render("addProduct", { prdctData, cateData, message: "Enter a valid product description" });
        }

        const parsedPrdctPrice = parseFloat(prdctPrice);
        const parsedPrdctQuantity = parseInt(prdctQuantity);

        // checking the price should not be less than 0
        if (parsedPrdctPrice <= 0) {
            const prdctData = await Product.find({});
            return res.render("addProduct", { prdctData, cateData, message: "Price of the product should be greater than zero" });
        }

        // checking the quantity should be atleast one
        if (parsedPrdctQuantity < 1) {
            const prdctData = await Product.find({});
            return res.render("addProduct", { prdctData, cateData, message: "Quantity of the product should be at least one" });
        }

        // checking if the image files are available
        if (!imgFiles || imgFiles.length === 0 || imgFiles.length < 4) {
            const prdctData = await Product.find({});
            return res.render("addProduct", { prdctData, cateData, message: "Please enter atleast 4 images" });
        }
         
        const prdctImage = imgFiles.map(img => img.filename);

        const product = new Product({
            prdctName: prdctName,
            prdctDescription: prdctDescription,
            prdctPrice: parsedPrdctPrice,
            prdctQuantity: parsedPrdctQuantity,
            categoryId: cateName,
            prdctImage: prdctImage
        });

        const prdctData = await product.save();

        if (prdctData) {
            res.redirect("/admin/productsList");
        }

    } catch (error) {
        console.log(error.message);
    }

}

// list product
const listProduct = async (req, res) => {

    try {

        const prdctId = req.params.prdctId;
        await Product.findByIdAndUpdate(prdctId, { is_listed: true });
        res.redirect("/admin/productsList");

    } catch (error) {
        console.log(error.message);
    }

}

// unlist product
const unlistProduct = async (req, res) => {

    try {

        const prdctId = req.params.prdctId;
        await Product.findByIdAndUpdate(prdctId, { is_listed: false });
        res.redirect("/admin/productsList");

    } catch (error) {
        console.log(error.message);
    }

}

//add product Load
const addProductLoad = async (req, res) => {

    try {

        const prdctData = await Product.find({});
        const cateData = await Category.find({});
        res.render("addProduct", { prdctData, cateData });

    } catch (error) {
        console.log(error.message);
    }

}

// edit product 
const editProduct = async (req, res) => {
    try {

        const cateData = await Category.find({});

        const prdctId = req.query.prdctId;

        //for getting the product data with the particular id
        const prdctData = await Product.findById({ _id: prdctId });

        // for getting product images only without id
        const productImagebyId = await Product.findById({ _id: prdctId },{prdctImage:1, _id: 0});

        // for getting the images only as an array
        const productImagesArray = productImagebyId.prdctImage.map(image => `${image}`);


        if (prdctData) {
            res.render("editProduct", { prdctData, cateData, productImagesArray });
        }
        else {
            res.redirect("/admin/productsList");
        }

    } catch (error) {
        console.log(error.message);
    }
}

// update category
const updateProduct = async (req, res) => {
    try {
        
        const cateData = await Category.find({});

        const { prdctId, prdctName, prdctDescription, prdctPrice, prdctQuantity, imgFiles } = req.body;

        // for getting product images only without id
        const productImagebyId = await Product.findById({ _id: prdctId },{prdctImage:1, _id: 0});

        // for getting the images only as an array
        const productImagesArray = productImagebyId.prdctImage.map(image => `${image}`);

        //for getting the product data with the particular id
        const prdctData = await Product.findOne({ _id: req.body.prdctId });
        
        if (!prdctData) {
            return res.status(404).send("Product not found");
        }

        // checking valid product name / space check
        if (!prdctName || /^\s*$/.test(prdctName)) {

            return res.render("editProduct", { prdctData, productImagesArray, cateData, message: "Enter a valid product name" });
        }

        // checking valid category description / space check
        if (!prdctDescription || /^\s*$/.test(prdctDescription)) {
            return res.render("editProduct", { prdctData, productImagesArray, cateData, message: "Enter a valid product description" });
        }

        const parsedPrdctPrice = parseFloat(prdctPrice);
        const parsedPrdctQuantity = parseInt(prdctQuantity);

        // checking the price should not be less than 0
        if (parsedPrdctPrice <= 0) {
            const prdctData = await Product.find({});
            return res.render("editProduct", { prdctData, productImagesArray, cateData, message: "Price of the product should be greater than zero" });
        }

        // checking the quantity should be atleast one
        if (parsedPrdctQuantity < 1) {
            const prdctData = await Product.find({});
            return res.render("editProduct", { prdctData, productImagesArray, cateData, message: "Quantity of the product should be at least one" });
        } 

        // // checking if the image files are available
        // if (!imgFiles || imgFiles.length === 0 || imgFiles.length < 4) {
        //     const prdctData = await Product.find({});
        //     return res.render("editProduct", { prdctData, productImagesArray, cateData, message: "Please enter atleast 4 images" });
        // }
                 
        // const prdctImage = imgFiles.map(img => img.filename);

        const updatedProduct = await Product.findByIdAndUpdate(prdctId, {
            prdctName,
            prdctDescription,
            prdctPrice: parsedPrdctPrice,
            prdctQuantity: parsedPrdctQuantity,
            // prdctImage: prdctImage
        });
        
        res.redirect("/admin/productsList");

    } catch (error) {
        console.log(error.message);
    }

}

// deleting product image
const deleteProductImage = async (req, res) =>{
    try {
        
        const cateData = await Category.find({});

        const imageId = req.query.imageId;
        
        const prdctData = await Product.findOne({prdctImage: imageId});
        
        // for getting product images only without id
        const productImagebyId = await Product.findOne({prdctImage: imageId },{prdctImage:1, _id: 0});

        // for getting the images only as an array
        const productImagesArray = productImagebyId.prdctImage.map(image => `${image}`);

        await Product.updateOne({prdctImage: imageId}, {$pull:{prdctImage: imageId}});
        
        res.render("editProduct", {prdctData, productImagesArray, cateData, message: "image deleted"});

    } catch (error) {
        console.log(error.message);
    }
}

//--------------------------------------------------------end-products-----------------------------------------------------//
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
            res.render("addCategory", { cateData, message: "Category added successfully" });
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
    listProduct,
    unlistProduct,
    addProductLoad,
    addProduct,
    editProduct,
    updateProduct,
    deleteProductImage,
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
    adminLogout

}