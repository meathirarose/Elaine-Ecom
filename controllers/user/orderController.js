const User = require("../../models/userdbModel");
const Product =require("../../models/productdbModel");
const Cart = require("../../models/cartdbModel");
const Order = require("../../models/orderdbSchema");
const Category = require("../../models/categorydbModel");
const Coupon = require("../../models/coupondbModel");
const Razorpay = require("razorpay");
require("dotenv").config();
var easyinvoice = require('easyinvoice');
const crypto = require("crypto");
const { error } = require("console");

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
        if (cartData.products.length > 0) {
            cartData.products.forEach(cartProduct => {
                if (cartProduct.productId.offer && cartProduct.productId.offer.status === true) {
                    const offer = cartProduct.productId.offer.offerPercentage;
                    const productPrice = cartProduct.productId.prdctPrice * cartProduct.quantity;
                    const offerPrice = productPrice - (productPrice * offer)/100;
                    totalPriceSum+=offerPrice;
                    cartData.totalCost = totalPriceSum;
                }else {
                    totalPriceSum+=cartProduct.productId.prdctPrice * cartProduct.quantity;
                    cartData.totalCost = totalPriceSum;
                }
            });
        } 
        await cartData.save();
        
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
                    return res.json({ error: "Coupon has already been used." });
                }else{
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
                }               

            }else{
                res.json({error: "coupon is not present"});
            }
            
        }else{
            res.json({error: "currently no coupons are available"});
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

        const coupon = req.session.couponCode;
        let couponDiscount = 0;
        if (coupon) {
            const couponData = await Coupon.findOne({ code: coupon });
            couponDiscount = couponData ? couponData.discount : 0;
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

        const totalAmount = cartData.totalCost - couponDiscount; 

        const newOrder = new Order({
            userId: userData._id,
            orderId: orderId,
            deliveryAddress: addressId,
            userName: userData.name,
            email: userData.email,
            couponDiscount: couponDiscount,
            totalAmount: totalAmount,
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

        if (coupon) {
            const couponData = await Coupon.findOne({ code: coupon });
            if (couponData) {
                const isCouponUsed = couponData.usedCoupons.some(coupon => coupon.userId.equals(req.session.user_id));
                if (!isCouponUsed) {
                    couponData.usedCoupons.push({ userId: req.session.user_id, status: true });
                    await couponData.save();
                }
            }
        }

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
        console.log(order);
        if(order){

            var newrazorpayOrder = new Order({
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
            razor_id: newrazorpayOrder._id,
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

// verify the razor pay payment
const verifyRazorPayment = async (req, res) => {
    try {
        
        const { paymentId, orderId, signature, order } = req.body;
        
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(orderId + '|' + paymentId);
        const hmacValue = hmac.digest('hex');

        if (hmacValue === signature) {
            
            await Order.findByIdAndUpdate({_id: order}, { paymentStatus: 'Paid' });
            console.log('Payment verification successful.');
            res.json({ message: "Payment Success" });

        } else {

            console.log('Payment verification failed.');
            res.json({ error: 'Signature mismatch' });

        }
    } catch (error) {

        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });

    }
};

// failed payment
const failedPayment = async (req, res) => {

    try {
        const { response, orderId } = req.body;
        console.log(response, orderId);
        // const { order_id, payment_id } = error.metadata; 
        // console.log(order_id, payment_id);
        const orderData = await Order.findByIdAndUpdate({_id: orderId},{paymentStatus: "Failed"});
        console.log(orderData);
        res.json({ success: true, message: 'Payment failed response handled successfully' });

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// retry rezor pay payment
const retryRazorPayment = async (req, res) => {

    try {
        
        const {orderId} = req.body;
        console.log(orderId,"oid");

        const orderData = await Order.findById(orderId);
        
        if(orderData.paymentStatus === 'Failed'){
            res.json({ success: true, message: "Payment retry initiated" });
        }else {
            res.json({ success: false, error: "Payment status is not Failed" });
        }

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// wallet pay
const createWalletOrder = async (req, res) => {

    try {
        
        const {paymentMode, addressId} = req.body;

        if (!addressId || !paymentMode) {
            throw new Error('Required data missing');
        }

        const coupon = req.session.couponCode;
        let couponDiscount = 0;
        if (coupon) {
            const couponData = await Coupon.findOne({ code: coupon });
            couponDiscount = couponData ? couponData.discount : 0;
        }

        const cartData = await Cart.findOne({ userId: req.session.user_id }).populate('products.productId');

        const userData = await User.findOne({ _id: req.session.user_id }, {_id: 1, name: 1, email:1});

        if(cartData.products.length === 0){
            return res.json({error: "Please add products to the cart"});
        }

        const orderId = await generateOrderId();

        const totalAmount = cartData.totalCost - couponDiscount;

        const newOrder = new Order({
            userId: userData._id,
            orderId: orderId,
            deliveryAddress: addressId,
            userName: userData.name,
            email: userData.email,
            couponDiscount: couponDiscount,
            totalAmount: totalAmount,
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

        if (coupon) {
            const couponData = await Coupon.findOne({ code: coupon });
            if (couponData) {
                const isCouponUsed = couponData.usedCoupons.some(coupon => coupon.userId.equals(req.session.user_id));
                if (!isCouponUsed) {
                    couponData.usedCoupons.push({ userId: req.session.user_id, status: true });
                    await couponData.save();
                }
            }
        }
        console.log("hellooooooooooooooooooooooooooooooooooooooooooooooooooo1");
        
        for (const product of cartData.products) {
            console.log(product.totalPrice, "pp");
            const userInfo = await User.findOne({_id: req.session.user_id});
            if(product.totalPrice <= userInfo.wallet){
                console.log("hellooooooooooooooooooooooooooooooooooooooooooooooooooo2");
                const walletHistoryEntry = {
                    date: new Date(),
                    amount: product.totalPrice,
                    reason: 'Product Purchase',
                    status: 'Debited'
                };
                await User.updateOne(
                    { _id: req.session.user_id },
                    {
                        $inc: { wallet: -product.totalPrice },
                        $push: { walletHistory: walletHistoryEntry }
                    }
                );

                await userInfo.save();

                if(newOrder){
                    newOrder.paymentStatus = 'Paid';
                    await newOrder.save();
                }

                for (const product of cartData.products) {
                    await Product.updateOne(
                        { _id: product.productId },
                        { $inc: { prdctQuantity: -product.quantity } } 
                    );
                }
                
                cartData.products.map(product => {
                    if(product.productId.prdctQuantity <= 0){
                        return res.json({error: "This product is out of Stock!"});
                    }
                });

                cartData.products = [];
                await cartData.save();

                res.json({ message: "Your order has been placed successfully." });
            }else{
                console.log("hellooooooooooooooooooooooooooooooooooooooooooooooooooo2");
                return res.json({error: 'Insufficient Balance.'});
            }

        }
        

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

        const cartData = await Cart.findOne({ userId: req.session.user_id })
                                    .populate({
                                        path: 'products.productId',
                                        populate: {
                                            path: 'offer'
                                        }
                                    });
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

// generate invoice
const generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        const orderData = await Order.findOne({_id: orderId}).populate('userId').populate('products.productId');

        const orderDate = new Date(orderData.date);
        const dueDateCalc = new Date(orderDate.getTime() + (15 * 24 * 60 * 60 * 1000));
        const dueDate = dueDateCalc.toDateString();
        
        const products = [];

        orderData.products.forEach((product) => {
            products.push({
                quantity: product.quantity ,
                description: product.productId.name,
                taxRate: 0, 
                price: product.productPrice
            });
        });

        const data = {
            apiKey: "free",
            mode: "development",
            images: {
                logo: "https://public.budgetinvoice.com/img/logo_en_original.png",
            },
            sender: {
                company: "Elaine Ecom",
                address: "New Delhi 123",
                zip: "652348",
                city: "New Delhi",
                country: "India"
            },
            client: {
                company: orderData.userName,
                address: orderData.userId.address[0].addressline,
                zip: orderData.userId.address[0].pincode,
                city: orderData.userId.address[0].city,
                country: "India"
            },
            information: {
                number: orderData.orderId,
                date: orderData.date.toDateString(),
                dueDate: dueDate
            },
            products: products,
            bottomNotice: "Kindly pay your invoice within 15 days.",
            settings: {
                currency: "INR"
            }
        };

        const result = await easyinvoice.createInvoice(data);
        const pdfBuffer = Buffer.from(result.pdf, 'base64');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
        res.send(pdfBuffer);

    } catch (error) {
        console.log('Error:', error.message); 
        res.status(500).send('Internal Server Error');
    }
};


// cancel product
const cancelProduct = async (req, res) => {

    try {
        
        const {orderId, productId} = req.body;
        
        const orderData = await Order.findById({_id: orderId});
        if (orderData.products && orderData.products.length > 0) {
            const product = orderData.products.find(product => {
                return String(product._id) === String(productId);
            });
            
            if(product){

                const {status} = product;

                if(status === 'Order Placed' || status === 'Order Shipping'){

                    product.status = 'Order Cancelled';
                    await orderData.save();

                    if(product.status === 'Order Cancelled'){
                      
                      const walletHistoryEntry = {
                            date: new Date(),
                            amount: product.totalPrice,
                            reason: 'Order Cancelletion Refund',
                            status: 'Credited'
                        } 
                        await User.updateOne(
                            {_id: req.session.user_id},
                            {
                                $inc: { wallet: +product.totalPrice },
                                $push: { walletHistory: walletHistoryEntry }
                            }
                        )
                        await userData.save();

                        await Product.updateOne(
                            { _id: product.productId }, 
                            { $inc: { prdctQuantity: +product.quantity } } 
                        );

                        return res.json({message: "Your order has been cancelled and the Purchase Amount is added to your wallet"});
                    }
                    
                }else if(status === 'Order Delivered'){

                    return res.json({error: "Product cannot be cancelled because it is already delivered."});

                }else{

                    return res.json({error: "Product cannot be cancelled because it is already cancelled or in an invalid status."});

                }

            }else{
                return res.json({error: "Corresponding product is not found in the order"});
            }

        }else{
            return res.json({error: "No order found"});
        }       

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// order success
const orderSuccessLoad = async (req, res) =>{
    try {
        
        res.render("orderSuccess");

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

// order history
const orderHistoryLoad = async (req, res) => {

    try {
        const userId = req.session.user_id;

        const orderData = await Order.find({ userId }).populate({
            path: 'products.productId',
            populate: {
                path: 'categoryId'
            }
        }).sort({date:-1});

        res.render("orderHistory", {orderData});

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
    createWalletOrder,
    verifyRazorPayment,
    failedPayment,
    retryRazorPayment,
    orderDetailsLoad,
    generateInvoice,
    cancelProduct,
    orderSuccessLoad,
    orderHistoryLoad
}