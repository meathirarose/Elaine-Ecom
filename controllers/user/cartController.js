const Product =require("../../models/productdbModel");
const Cart = require("../../models/cartdbModel");


// cart load
const cartLoad = async (req, res) => {
    
    try {

        const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');

        const productData = await Product.find({});

        if(!cartData || !productData){
            res.redirect("/products");
        }else{
            cartData.products.forEach(product => {
                product.updatedTotalPrice = product.quantity * product.productPrice;
            });
            const totalCost = cartData.products.reduce((total, product) => total + product.totalPrice, 0);
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

        //for getting the product data with the particular id
        const productDatabyId = await Product.findById({ _id: productId });

        if(productDatabyId.prdctQuantity === 0){
            return res.json({ message: "Out of stock" })
        }

        const cartData = await Cart.findOne({userId: req.session.user_id});
        
        if (cartData) {
            
            const alreadyExist = cartData.products.find((pro) => pro.productId.toString() == productId);
            if (alreadyExist) {

                return res.json({ message: "Item is already in the cart" });

            } else {
                // If the product doesn't exist in the cart, add it
                await Cart.findOneAndUpdate({
                    userId: req.session.user_id
                }, {
                    $push: {
                        products: {
                            productId: productId,
                            quantity: 1, 
                            productPrice: productDatabyId.prdctPrice,
                            totalPrice: productDatabyId.prdctPrice 
                        }
                    }
                });
                return res.json({ message: "Item added to cart" });

            }
        } else {
            // If the user doesn't have a cart yet, create a new cart and add the product to it
            const newCart = new Cart({
                products: [{
                    productId: productId,
                    quantity: 1, 
                    productPrice: productDatabyId.prdctPrice,
                    totalPrice: productDatabyId.prdctPrice
                }],
                userId: req.session.user_id,
            });

            await newCart.save();
            return res.json({ message: "Item added to cart" });

        }      
        //res.redirect("/products");

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// update cart quantity
const updateCartQuantity = async (req, res) =>{

    try {
        
        const productId = req.params.productId;
        const { quantity } = req.body;

        const productDataById = await Product.findById(productId);

        await Cart.findOneAndUpdate(
            { 
                userId: req.session.user_id,
                "products.productId": productId 
            }, 
            { 
                $set: { 
                    "products.$.quantity": quantity,
                    "products.$.productPrice": productDataById.prdctPrice,
                    "products.$.totalPrice": quantity * productDataById.prdctPrice
                }
            }
        );

        const updatedCartData = await Cart.findOne(
            { 
                userId: req.session.user_id,
                "products.productId": productId 
            }
        );

        const totalCost = updatedCartData.products.reduce((accumulator, product) => {
            return accumulator + product.totalPrice;
        }, 0);

        updatedCartData.totalCost = totalCost;
        await updatedCartData.save();

        const updatedProduct = updatedCartData.products.find(product => product.productId == productId);
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