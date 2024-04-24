const User = require("../../models/userdbModel");
const Product =require("../../models/productdbModel");
const Cart = require("../../models/cartdbModel");
const Order = require("../../models/orderdbSchema");
const Category = require("../../models/categorydbModel");
const Coupon = require("../../models/coupondbModel");
const Razorpay = require("razorpay");
require("dotenv").config();


// razor pay instance
var razorpayInstance = new Razorpay(
    { 
        key_id: process.env.RAZORPAY_KEY_ID, 
        key_secret: process.env.RAZORPAY_KEY_SECRET 
    })

// load checkout page
const checkoutLoad = async (req, res) => {

    try {
        
        const userDataCheckout = await User.findById(
            {
                _id: req.session.user_id
            }
        );

        const couponCode = req.session.couponCode;
        const couponData = await Coupon.find({});

        if(couponData){
            var couponExists = couponData.find(coupon => coupon.code === couponCode);
        }

        const cartData = await Cart.findOne({ userId: req.session.user_id })
                                    .populate({
                                        path: 'products.productId',
                                        populate: {
                                            path: 'offer'
                                        }
                                    });
        let totalPriceSum = 0;
        if (cartData) {
            cartData.products.forEach(cartProduct => {
                if (cartProduct.productId && cartProduct.productId.offer) {
                    const offer = cartProduct.productId.offer.offerPercentage;
                    const productPrice = cartProduct.productId.prdctPrice;
                    const offerPrice = productPrice - (productPrice * offer)/100;
                    totalPriceSum+=offerPrice;
                    console.log('Offer for product with ID', productPrice);
                    console.log('Offer details:', offer);
                    console.log('Offer price:', offerPrice);
                    console.log('Offer price:', totalPriceSum);
                }else {
                    totalPriceSum+=cartProduct.productId.prdctPrice;
                }
            });
        } 

        res.render("checkout", {userDataCheckout, cartData, couponExists, totalPriceSum});

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// adding coupons
const addCoupon = async (req, res) => {

    try {
        
        let couponCode = req.body.couponCode;
        let currentDate = Date.now();
        const userId = req.session.user_id;
        const couponData = await Coupon.find({});

        if(couponData){
            const couponExists = couponData.find(coupon => coupon.code === couponCode);
            if(couponExists && couponExists.validity >=currentDate){

                const usedCoupon = couponExists.usedCoupons.find(entry => entry.userId.equals(userId));
                if (usedCoupon && usedCoupon.status === true) {
                    return res.json({ message: "Coupon has already been used." });
                }

                const discount = couponExists.discount;
                
                const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');

                let totalPriceSum = 0;
                cartData.products.forEach(product => {
                    totalPriceSum += product.totalPrice;
                });

                let totalCost = totalPriceSum;
                if(totalCost >= couponExists.minimumAmount){
                    totalCost-=discount;
                }
                
                cartData.totalCost = totalCost;
                await cartData.save();

                req.session.couponCode = couponCode;

                res.json({message: "coupon added successfully", discount: discount});

            }else{
                res.json({message: "coupon is not present"});
            }
            
        }else{
            res.json({message: "currently no coupons are available"});
        }       

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

        const coupon = req. session.couponCode;
        let couponDiscount = 0;
        if(coupon){
            var couponData = await Coupon.findOne({code: coupon});
            couponDiscount = couponData.discount;
        }else{
            couponDiscount = 0;
        }

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
            couponDiscount: couponDiscount,
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
        console.log('====================================================================================')
        console.log(newOrder);
        console.log('====================================================================================')

        if (coupon) {
            const couponData = await Coupon.findOne({ code: coupon });

            if (couponData && !couponData.usedCoupons.some(coupon => coupon.userId.equals(req.session.user_id))) {
                newOrder.couponDiscount = couponData.discount;
                couponData.usedCoupons.push({ userId: req.session.user_id, status: true });
                await couponData.save();
            }
        }

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

        if(newOrder){
            newOrder.paymentStatus = 'Paid';
            await newOrder.save();
        }

        res.json({ message: "Your order has been placed successfully." });

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

// razor pay order
const createRazorpayOrder = async (req, res) => {
    try {
        const { addressId, paymentMode } = req.body;

        if (!addressId || !paymentMode) {
            throw new Error('Required data missing');
        }

        const coupon = req. session.couponCode;
        let couponDiscount = 0;
        if(coupon){
            var couponData = await Coupon.findOne({code: coupon});
            couponDiscount = couponData.discount;
        }else{
            couponDiscount = 0;
        }

        const cartData = await Cart.findOne({ userId: req.session.user_id }).populate('products.productId');
        const userData = await User.findOne({ _id: req.session.user_id }, { _id: 1, name: 1, email: 1, mobile: 1 });

        if(cartData.products.length === 0){
            return res.json({message: "Please add products to the cart"});
        }

        const amount = cartData.totalCost * 100;
        const orderId = await generateOrderId();

        const options = {
            amount: amount,
            currency: "INR",
            receipt: process.env.AUTHENTICATION_EMAIL
        };

        const order = await razorpayInstance.orders.create(options);
        
        if(order){

            const newrazorpayOrder = new Order({
                userId: userData._id,
                orderId: orderId,
                deliveryAddress: addressId,
                userName: userData.name,
                email: userData.email,
                couponDiscount: couponDiscount,
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

            await newrazorpayOrder.save();

            if (coupon) {
                const couponData = await Coupon.findOne({ code: coupon });
    
                if (couponData && !couponData.usedCoupons.some(coupon => coupon.userId.equals(req.session.user_id))) {
                    newOrder.couponDiscount = couponData.discount;
                    couponData.usedCoupons.push({ userId: req.session.user_id, status: true });
                    await couponData.save();
                }
            }   

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

        }

        res.json({
            success: true,
            msg: "Order Created",
            order_id: order.id,
            amount: amount,
            key_id: process.env.RAZORPAY_KEY_ID,
            name: userData.name,
            email: userData.email,
            contact: userData.mobile
        });



    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}


// const order details load
const orderDetailsLoad = async (req, res) => {

    try {

        const orderId = req.query.orderId;        

        const userId = req.session.user_id;

        const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');

        if(req.session.couponCode){
            const couponData = await Coupon.findOne({code: req.session.couponCode});
            if(couponData){
                var discount = couponData.discount;
            }
        }

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

        let totalPriceSum = 0;
        totalPriceSum = orderData.totalCost + discount;

        res.render("orderDetails",{ cartData, orderData, productsData, address, totalPriceSum, discount });


    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

const orderSuccessLoad = async (req, res) =>{
    try {
        
        res.render("orderSuccess");

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

module.exports = {

    checkoutLoad,
    addCoupon,
    placeOrder,
    createRazorpayOrder,
    orderDetailsLoad,
    orderSuccessLoad

}