const Product = require('../../models/productdbModel');
const Wishlist = require('../../models/wishlistdbModel');


// wishlist load
const wishlistLoad = async (req, res) => {

    try {

        const wishlistData = await Wishlist.findOne({userId: req.session.user_id}).populate('products.productId');
        console.log('====================================================================================')
        console.log(wishlistData);
        console.log('====================================================================================')

        const productData = await Product.find({});

        if(!wishlistData || !productData){
            res.redirect("/products");
        }else{
            res.render("wishlist" ,{wishlistData:wishlistData, productData:productData});
        }
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// add to wishlist
const addToWishlist = async (req, res) => {

    try {
        
        const productId = req.query.productId;

        const productDataById = await Product.findOne({_id: productId});

        if(productDataById.prdctQuantity === 0){
            return res.json({message: "Out of Stock"});
        }

        const wishlistData = await Wishlist.findOne({userId: req.session.user_id});

        if(wishlistData){
            const alreadyExist = wishlistData.products.find((product) => product.productId.toString() == productId);
            if(alreadyExist){
                return res.json({message: "Item already in wishlist"});
            }else{
            // If the product doesn't exist in the wishlist, add it
                await Wishlist.findOneAndUpdate({
                    userId: req.session.user_id
                }, {
                    $push: {
                        products: {
                            productId: productId,
                            productPrice: productDataById.prdctPrice,
                        }
                    },
                    userId: req.session.user_id
                });
                return res.json({ message: "Item added to wishlist" });
            }
        }else{
        // If the user doesn't have a wishlist yet, create a new wishlist and add the product to it
        const newWishlist = new Wishlist({
            products: [{
                productId: productId,
                productPrice: productDataById.prdctPrice,
            }],
            userId: req.session.user_id,
        });

        await newWishlist.save();
        return res.json({ message: "Item added to wishlist" });

        }

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// delete wishlist elements
const deleteWishlistItem = async (req, res) => {
    try {

        const productId = req.body.productId;
        console.log('====================================================================================')
        console.log(productId, "here iam productId form delete wishlist item ----------------------------");
        console.log('====================================================================================')

        await Wishlist.findOneAndUpdate(
            {
                userId: req.session.user_id
            },
            {
                $pull: { products: { productId: productId } }
            }
        );

        res.json({ message: "Product removed from wishlist successfully" });

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
};

module.exports = {

    wishlistLoad,
    addToWishlist,
    deleteWishlistItem

}