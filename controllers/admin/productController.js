const Category = require("../../models/categorydbModel");
const Product = require("../../models/productdbModel");


// product list load
const productListLoad = async (req, res) => {

    try {

        const prdctData = await Product.find().populate('categoryId');
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
        const prdctData = await Product.findById({ _id: prdctId }).populate('categoryId');

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

// updateProduct
const updateProduct = async (req, res) => {
    try {

        const prdctId = req.query.prdctId;

        const { prdctName, prdctDescription, prdctPrice, prdctQuantity, prdctCategory } = req.body;

        const cateName = await Category.findOne({cateName:prdctCategory}, {_id:1});

        // for getting product images only without id
        const productImagebyId = await Product.findById({ _id: prdctId }, { prdctImage: 1, _id: 0 });

        // for getting the images only as an array
        const productImagesArray = productImagebyId.prdctImage.map(image => `${image}`);

        //for getting the product data with the particular id
        const prdctData = await Product.findById({ _id: prdctId }).populate('categoryId');

        if (!prdctData) {
             res.render("editProduct",{prdctData, productImagesArray, success: false, message: "Product not found" });
        }

        // checking valid product name / space check
        if (!prdctName || /^\s*$/.test(prdctName)) {
            return res.render("editProduct",{prdctData, productImagesArray, success: false, message: "Enter a valid product name" });
        }

        // checking valid category description / space check
        if (!prdctDescription || /^\s*$/.test(prdctDescription)) {
            return res.render("editProduct",{prdctData, productImagesArray, success: false, message: "Enter a valid product description" });
        }

        const parsedPrdctPrice = parseFloat(prdctPrice);
        const parsedPrdctQuantity = parseInt(prdctQuantity);

        // checking the price should not be less than 0
        if (parsedPrdctPrice <= 0) {
            return res.render("editProduct",{prdctData, productImagesArray, success: false, message: "Price of the product should be greater than zero" });
        }

        // checking the quantity should be at least one
        if (parsedPrdctQuantity < 1) {
            return res.render("editProduct",{prdctData, productImagesArray, success: false, message: "Quantity of the product should be at least one" });
        }

        // checking if the image files are available
        // if (!imgFiles || imgFiles.length === 0 || imgFiles.length < 4) {
        //     return res.render("editProduct",{prdctData, productImagesArray, success: false, message: "Please upload at least 4 images" });
        // }

        // const prdctImage = imgFiles.map(img => img.filename);

        const updatedProduct = await Product.findByIdAndUpdate(prdctId, {
            prdctName,
            prdctDescription,
            prdctPrice: parsedPrdctPrice,
            prdctQuantity: parsedPrdctQuantity,
            // prdctImage: prdctImage,
            categoryId: cateName
        });

        if (updatedProduct) {
            return res.redirect("productsList");
        } else {
            return res.render("editProduct",{prdctData, productImagesArray, success: false, message: "Failed to update product" });
        }

    } catch (error) {
        console.log(error.message);
    }
}



// deleting product image
const deleteProductImage = async (req, res) =>{
    try {

        const imageId = req.query.imageId;
        
        const prdctData = await Product.findOne({prdctImage: imageId});
        if (!prdctData) {
            return res.json({ message: "Product not found" });
        }

        await Product.updateOne({prdctImage: imageId}, {$pull:{prdctImage: imageId}});
        
        res.json({ message: "Image deleted successfully" });

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {

    productListLoad,
    listProduct,
    unlistProduct,
    addProductLoad,
    addProduct,
    editProduct,
    updateProduct,
    deleteProductImage,

}