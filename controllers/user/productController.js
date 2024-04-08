const Product =require("../../models/productdbModel");


// all product list
const allProductsListLoad = async (req, res) => {

    try {
        
        const productsData = await Product.find({});
        console.log('====================================================================================')
        console.log(productsData,"-------------------------------------------------here productsData-----");
        console.log('====================================================================================')
        res.render("products", { productsData: productsData });

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// sorting products 
const sortProducts = async (req, res) => {
    try {
        
        const productsData = await Product.find({});

        const sortOption = req.query.sortOption;

        let sortedProducts;
    
        switch (sortOption) {
            case 'priceLowToHigh':
                sortedProducts = productsData.sort((a, b) => a.prdctPrice - b.prdctPrice);
                break;
            case 'priceHighToLow':
                sortedProducts = productsData.sort((a, b) => b.prdctPrice - a.prdctPrice);
                break;
            case 'nameAZ':
                sortedProducts = productsData.sort((a, b) => a.prdctName.localeCompare(b.prdctName));
                break;
            case 'nameZA':
                sortedProducts = productsData.sort((a, b) => b.prdctName.localeCompare(a.prdctName));
                break;
            default:
                sortedProducts = productsData;
        }

        res.json(sortedProducts);

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
        const productDatabyId = await Product.findById({ _id: productId });

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
    productDetailsLoad,

}