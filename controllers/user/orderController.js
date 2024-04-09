const User = require("../../models/userdbModel");
const Product =require("../../models/productdbModel");
const Cart = require("../../models/cartdbModel");
const Order = require("../../models/orderdbSchema");
const Category = require("../../models/categorydbModel");


// load checkout page
const checkoutLoad = async (req, res) => {

    try {
        
        const userDataCheckout = await User.findById(
            {
                _id: req.session.user_id
            }
        );
        const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');

        res.render("checkout", {userDataCheckout, cartData});

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// Function to generate a new order ID
async function generateOrderId() {
    const lastOrder = await Order.findOne().sort({ orderId: -1 }).limit(1);
    let nextId = 1001; 

    if (lastOrder && typeof lastOrder.orderId === 'string') {

        const numericPart = lastOrder.orderId.replace('OrderID#', '');
        if (!isNaN(numericPart)) {
            const lastId = parseInt(numericPart, 10);
            nextId = lastId + 1;
        }
    }

    return `OrderID#${nextId}`;
}

// load place order
const placeOrder = async (req, res) => {
    try {
        const { addressId, paymentMode } = req.body;

        if (!addressId || !paymentMode) {
            throw new Error('Required data missing');
        }

        const cartData = await Cart.findOne({ userId: req.session.user_id }).populate('products.productId');

        const userData = await User.findOne({ _id: req.session.user_id }, {_id: 1, name: 1, email:1});

        if(cartData.products.length === 0){
            return res.json({message: "Please add products to the cart"});
        }

        const orderId = await generateOrderId();

        const newOrder = new Order({
            userId: userData._id,
            orderId: orderId,
            deliveryAddress: addressId,
            userName: userData.name,
            email: userData.email,
            totalAmount: cartData.totalCost,
            date: new Date(),
            payment: paymentMode,
            products: cartData.products.map(product => ({
                productId: product.productId,
                productName: product.productId.prdctName,
                quantity: product.quantity,
                productPrice: product.productPrice,
                totalPrice: product.totalPrice
              }))
             
        })

        await newOrder.save();

        for (const product of cartData.products) {
            await Product.updateOne(
                { _id: product.productId },
                { $inc: { prdctQuantity: -product.quantity } } 
            );
        }
        
        cartData.products.map(product => {
            if(product.productId.prdctQuantity <= 0){
                return res.json({message: "This product is out of Stock!"});
            }
        });

        cartData.products = [];
        await cartData.save();

        res.json({ message: "Your order has been placed successfully." });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
}

// const order details load
const orderDetailsLoad = async (req, res) => {

    try {

        const orderId = req.query.orderId;        

        const userId = req.session.user_id;

        const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');

        const orderData = await Order.find({ userId, _id: orderId });
1
        const productDataPromises = orderData.map(async order => {
            const products = order.products.map(async product => {

                const productData = await Product.findById(product.productId);
                const categoryData = await Category.findById(productData.categoryId);
                const cateName = categoryData.cateName;

                return { ...product.toObject(), productData, cateName };
            });
            return Promise.all(products);
        });

        const productsData = await Promise.all(productDataPromises);

        for (const order of orderData) {
            const addressId = order.deliveryAddress; 
            const user = await User.findById(userId); 
        
            var address = user.address.find(address => address._id == addressId);
        }

        res.render("orderDetails",{ cartData, orderData, productsData, address });


    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

module.exports = {

    checkoutLoad,
    placeOrder,
    orderDetailsLoad,

}