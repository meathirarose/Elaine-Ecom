const Product = require("../../models/productdbModel");
const Category = require("../../models/categorydbModel");


// all product list
const allProductsListLoad = async (req, res) => {

    try {
        
        const productsData = await Product.find({});
        const categoryData = await Category.find({});

        res.render("products", { productsData: productsData, categoryData: categoryData });

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// sorting products 
const sortProducts = async (req, res) => {

    try {
        
        const sortOption = req.body.sortby;
        let sortedData;
                
        switch(sortOption){
            
            case 'priceLowToHigh':
                sortedData = await Product.find({}).sort({prdctPrice: 1});
                break;
            case 'priceHighToLow':
                sortedData = await Product.find({}).sort({prdctPrice: -1});
                break;
            case 'newArrivals': 
                sortedData = await Product.find({}).sort({createdOn: -1});
                break;
            case 'nameAZ':
                sortedData = await Product.find({}).sort({prdctName: 1});
                break;
            case 'nameZA':
                sortedData = await Product.find({}).sort({prdctName: -1});
                break;
            default:
                res.json({ success: false, message: 'Invalid sort option' });
                return;
           
        }
        
        res.json({success: true, data: sortedData});

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// product details load
const productDetailsLoad = async (req, res) => {

    try {

        const productId = req.query.productId;

        //for getting the product data with the particular id
        const productDatabyId = await Product.findById({ _id: productId }).populate('categoryId');

        // for getting product images only without id 
        const productImagebyId = await Product.findById({ _id: productId },{prdctImage:1, _id:0});

        // for getting the images only as an array
        const productImagesArray = productImagebyId.prdctImage.map(image => `${image}`);

        res.render("productDetails", {productDatabyId, productImagebyId, productImagesArray});

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}



module.exports = {

    allProductsListLoad,
    sortProducts,
    productDetailsLoad
    

}