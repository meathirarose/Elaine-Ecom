const Category = require("../../models/categorydbModel");
const Product = require("../../models/productdbModel");
const sharp = require("sharp");
const multer = require('multer');
const path = require('path');


// product list load
const productListLoad = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1; 
        const pageSize = 6; 
        const skip = (page - 1) * pageSize;

        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / pageSize);

        const prdctData = await Product.find().populate('categoryId').sort({createdOn: -1}).skip(skip).limit(pageSize);
        const cateData = await Category.find({});

        res.render("productsList", { 
            prdctData, 
            cateData, 
            totalPages, 
            currentPage: page 
        });

    } catch (error) {
        res.render("404error");
    }
}


// Multer configuration for uploading original images
const originalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../public/uploads"));
    },
    filename: (req, file, cb) => {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

// Multer configuration for saving processed images
const processedStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../public/processed_images"));
    },
    filename: (req, file, cb) => {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const uploadOriginal = multer({ 
    storage: originalStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('File type not supported'), false);
        }
    }
});
const uploadProcessed = multer({ storage: processedStorage });

// crop image using sharp
const processImage = async (imagePath, outputFolder) => {
    try {
        const metadata = await sharp(imagePath).metadata();
        const { width, height } = metadata;

        const fileExtensionRegex = /\.(jpg|jpeg|png|gif|webp)(\?.*)*$/i;
        const filename = path.basename(imagePath);
        if (!fileExtensionRegex.test(filename)) {
            throw new Error('Invalid image file extension');
        }
        const outputFilename = filename.replace('.', '_cropped_resized.');
        const outputPath = path.join(outputFolder, outputFilename);

        const cropWidth = Math.min(width, 1500);  
        const cropHeight = Math.min(height, 1800); 
        const cropLeft = Math.max(0, (width - cropWidth) / 2); 
        const cropTop = Math.max(0, (height - cropHeight) / 2);

        await sharp(imagePath)
        .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight }) 
        .resize(1200, 1800) 
            .toFile(outputPath);
        
        return { filename: filename, processedFilename: outputFilename, processedPath: outputPath };
    } catch (error) {
        res.render("404error");
    }
};



// Adding products
const addProduct = async (req, res) => {
    try {
        const cateData = await Category.find({});

        const prdctName = req.body.prdctName.trim();
        const prdctDescription = req.body.prdctDescription.trim();
        const prdctPrice = req.body.prdctPrice;
        const prdctQuantity = req.body.prdctQuantity;
        const imgFiles = req.files;
        const cateName = req.body.cateId;
        const createdOn = Date.now();

        // Checking valid product name / space check
        if (!prdctName || /^\s*$/.test(prdctName)) {
            const prdctData = await Product.find({});
            return res.render("addProduct", { prdctData, cateData, message: "Enter a valid product name" });
        }

        // Checking valid category description / space check
        if (!prdctDescription || /^\s*$/.test(prdctDescription)) {
            const prdctData = await Product.find({});
            return res.render("addProduct", { prdctData, cateData, message: "Enter a valid product description" });
        }

        const parsedPrdctPrice = parseFloat(prdctPrice);
        const parsedPrdctQuantity = parseInt(prdctQuantity);

        // Checking the price should not be less than 0
        if (parsedPrdctPrice <= 0) {
            const prdctData = await Product.find({});
            return res.render("addProduct", { prdctData, cateData, message: "Price of the product should be greater than zero" });
        }

        // Checking the quantity should be at least one
        if (parsedPrdctQuantity < 1) {
            const prdctData = await Product.find({});
            return res.render("addProduct", { prdctData, cateData, message: "Quantity of the product should be at least one" });
        }

        // Checking if the image files are available
        if (!imgFiles || imgFiles.length === 0 || imgFiles.length < 4) {
            const prdctData = await Product.find({});
            return res.render("addProduct", { prdctData, cateData, message: "Please enter at least 4 images" });
        }
        
        // Processing images - cropped and resized
        const prdctImage = [];
        for(const imgFile of imgFiles){

            const originalImagePath = imgFile.path;

            const { processedFilename } = await processImage(originalImagePath, path.join(__dirname, "../../public/processed_images"));
            
            prdctImage.push(processedFilename);
        }

        const product = new Product({
            prdctName: prdctName,
            prdctDescription: prdctDescription,
            prdctPrice: parsedPrdctPrice,
            prdctQuantity: parsedPrdctQuantity,
            categoryId: cateName,
            prdctImage: prdctImage,
            createdOn: createdOn
        });

        const prdctData = await product.save();
        
        if (prdctData) {
            res.redirect("/admin/productsList");
        }

    } catch (error) {
        res.render("404error");
    }
};

// list product
const listProduct = async (req, res) => {

    try {

        const prdctId = req.params.prdctId;
        await Product.findByIdAndUpdate(prdctId, { is_listed: false });
        res.redirect("/admin/productsList");

    } catch (error) {
        res.render("404error");
    }

}

// unlist product
const unlistProduct = async (req, res) => {

    try {

        const prdctId = req.params.prdctId;
        
        await Product.findByIdAndUpdate(prdctId, { is_listed: true });

        res.redirect("/admin/productsList");

    } catch (error) {
        res.render("404error");
    }

}

//add product Load
const addProductLoad = async (req, res) => {

    try {

        const prdctData = await Product.find({});
        const cateData = await Category.find({});
        res.render("addProduct", { prdctData, cateData });

    } catch (error) {
        res.render("404error");
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
        res.render("404error");
    }
}

// updateProduct
const updateProduct = async (req, res) => {
    try {

        const prdctId = req.query.prdctId;

        const { prdctName, prdctDescription, prdctPrice, prdctQuantity, prdctCategory } = req.body;

        const cateName = await Category.findOne({cateName:prdctCategory}, {_id:1});

        // Check if an image is being deleted
        if (req.query.imageId) {
            try {
                const result = await deleteProductImage(req.query.imageId);
                return res.json(result);
            } catch (error) {
                return res.status(500).json({ message: error.message });
            }
        }

        // Check if images are being uploaded
        if (req.files) {
            try {
                const result = await editProductImages(prdctId, req.files);
                return res.json(result);
            } catch (error) {
                return res.json({ message: error.message });
            }
        }

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

        const updatedProduct = await Product.findByIdAndUpdate(prdctId, {
            prdctName,
            prdctDescription,
            prdctPrice: parsedPrdctPrice,
            prdctQuantity: parsedPrdctQuantity,
            categoryId: cateName
        });

        if (updatedProduct) {
            return res.redirect("productsList");
        } else {
            return res.render("editProduct",{prdctData, productImagesArray, success: false, message: "Failed to update product" });
        }

    } catch (error) {
        res.render("404error");
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
        res.render("404error");
    }
}

// replace product images
const editProductImages = async (req, res) =>{

    try {
        const imgFiles = req.files;

        const prdctId = req.body.prdctId[0];

        const allProductsData = await Product.findById({_id: prdctId});

        //checking if the image files are available
        if (!imgFiles || imgFiles.length === 0 || (imgFiles.length + allProductsData.prdctImage.length < 4)) {
            return res.json({message: "Please upload at least 4 images" });
        }
        // Processing images - cropped and resized
        const prdctImage = [];
        for(const imgFile of imgFiles){

            const originalImagePath = imgFile.path;

            const { processedFilename } = await processImage(originalImagePath, path.join(__dirname, "../../public/processed_images"));
            
            prdctImage.push(processedFilename);

        }

        await Product.updateOne(
            {_id: prdctId},
            { $push: 
                { prdctImage: { $each: prdctImage } } }
        );

        res.json({message: "Image added successfully" });


    } catch (error) {
        res.render("404error");
    }

}

module.exports = {

    productListLoad,
    listProduct,
    unlistProduct,
    addProductLoad,
    addProduct,
    uploadProcessed,
    uploadOriginal,
    editProduct,
    updateProduct,
    deleteProductImage,
    editProductImages
}