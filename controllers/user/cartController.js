const Product =require("../../models/productdbModel");
const Cart = require("../../models/cartdbModel");
const Offer = require("../../models/offerdbModel");


// cart load
const cartLoad = async (req, res) => {
    
    try {

        const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');
        console.log('====================================================================================')
        console.log(cartData);
        console.log('====================================================================================')

        const productData = await Product.find({}).populate('offer');

        const offerData = await Offer.find({});

        if(!cartData || !productData){
            res.redirect("/products");
        }else{

            cartData.products.forEach(async (cartProduct) => {
                const product = productData.find((product) => product._id.equals(cartProduct.productId._id));
                const offer = product.offer;
                if (offer && offer.status === true) {

                    const offerPrice = product.prdctPrice - (offer.offerPercentage * product.prdctPrice) / 100;
                    cartProduct.productPrice = offerPrice;
                    cartProduct.updatedTotalPrice = cartProduct.quantity * offerPrice;

                } else {
                    cartProduct.updatedTotalPrice = cartProduct.quantity * cartProduct.productPrice;
                }

            });
            const totalCost = cartData.products.reduce((total, product) => total + product.updatedTotalPrice, 0);
            cartData.totalCost = totalCost;
            await cartData.save();
    
            res.render("cart" ,{cartData:cartData, productData:productData});
        }

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// add products to cart
const addProductsToCart = async (req, res) => {
    try {
        const productId = req.query.productId;

        // Fetch the product data with the particular ID
        const productDatabyId = await Product.findById(productId).populate('offer');

        // Check if the product is out of stock
        if (productDatabyId.prdctQuantity === 0) {
            return res.json({ message: "Out of stock" })
        }

        // Find the cart data for the current user
        const cartData = await Cart.findOne({ userId: req.session.user_id });
        
        if (cartData) {
            // Check if the product already exists in the cart
            const alreadyExist = cartData.products.find((pro) => pro.productId.toString() == productId);
            if (alreadyExist) {
                return res.json({ message: "Item is already in the cart" });
            } else {
                // Calculate the product price based on offer if available
                let productPrice;
                if (productDatabyId.offer !== null && productDatabyId.offer.status === true) {
                    productPrice = productDatabyId.prdctPrice - (productDatabyId.offer.offerPercentage * productDatabyId.prdctPrice) / 100;
                } else {
                    productPrice = productDatabyId.prdctPrice;
                }

                // Add the product to the cart with the calculated product price
                await Cart.findOneAndUpdate({
                    userId: req.session.user_id
                }, {
                    $push: {
                        products: {
                            productId: productId,
                            quantity: 1,
                            productPrice: productPrice,
                            totalPrice: productPrice // Initially set the total price same as product price
                        }
                    }
                });

                return res.json({ message: "Item added to cart" });
            }
        } else {
            // Create a new cart if the user doesn't have one yet
            let productPrice;
            if (productDatabyId.offer !== null && productDatabyId.offer.status === true) {
                productPrice = productDatabyId.prdctPrice - (productDatabyId.offer.offerPercentage * productDatabyId.prdctPrice) / 100;
            } else {
                productPrice = productDatabyId.prdctPrice;
            }

            const newCart = new Cart({
                products: [{
                    productId: productId,
                    quantity: 1,
                    productPrice: productPrice,
                    totalPrice: productPrice // Initially set the total price same as product price
                }],
                userId: req.session.user_id,
            });

            await newCart.save();
            return res.json({ message: "Item added to cart" });
        }
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}


// update cart quantity
const updateCartQuantity = async (req, res) => {
    try {
        const productId = req.params.productId;
        const { quantity } = req.body;

        // Fetch the product data by ID and populate the offer details
        const productDataById = await Product.findById(productId).populate('offer');

        // Calculate the product price based on the offer if available
        let productPrice;
        if (productDataById.offer !== null && productDataById.offer.status === true) {
            productPrice = productDataById.prdctPrice - (productDataById.offer.offerPercentage * productDataById.prdctPrice) / 100;
        } else {
            productPrice = productDataById.prdctPrice;
        }

        // Update the cart with the new quantity, product price, and total price
        await Cart.findOneAndUpdate(
            { 
                userId: req.session.user_id,
                "products.productId": productId 
            }, 
            { 
                $set: { 
                    "products.$.quantity": quantity,
                    "products.$.productPrice": productPrice,
                    "products.$.totalPrice": quantity * productPrice
                }
            }
        );

        // Retrieve the updated cart data
        const updatedCartData = await Cart.findOne(
            { 
                userId: req.session.user_id,
                "products.productId": productId 
            }
        );

        // Calculate the total cost of the cart
        const totalCost = updatedCartData.products.reduce((accumulator, product) => {
            return accumulator + product.totalPrice;
        }, 0);

        // Update the total cost of the cart
        updatedCartData.totalCost = totalCost;
        await updatedCartData.save();

        // Find the updated product in the cart
        const updatedProduct = updatedCartData.products.find(product => product.productId == productId);
        
        // Return the updated total price and total cost as JSON response
        return res.json({ 
            success: true, 
            updatedTotalPrice: updatedProduct.totalPrice,
            totalCost: totalCost 
        });
        
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}


// delete cart elements
const deleteCartItem = async (req, res) => {
    try {
        const productId = req.params.productId;

        await Cart.findOneAndUpdate(
            {
                userId: req.session.user_id
            },
            {
                $pull: { products: { productId: productId } }
            }
        );

        const updatedCartData = await Cart.findOne({ userId: req.session.user_id });
        const totalCost = updatedCartData.products.reduce((accumulator, product) => {
            return accumulator + product.totalPrice;
        }, 0);

        updatedCartData.totalCost = totalCost;
        await updatedCartData.save();

        res.json({ success: true, totalCost: totalCost });
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
};


module.exports = {
    
    cartLoad,
    addProductsToCart,
    updateCartQuantity,
    deleteCartItem,
    
}