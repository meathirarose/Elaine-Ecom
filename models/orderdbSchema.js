const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    
    orderId: {
        type: String,
        unique: true, 
    },

    deliveryAddress : {
        type: String,
    },

    userName: {
        type: String
    },

    email: {
        type: String
    },

    couponDiscount: {
        type: Number,
        default: 0
    },

    offerDiscount: {
        type: Number,
        default: 0
    },

    deliveryCharge: {
        type: Number,
        default: 60
    },

    totalAmount:{
        type: Number,
    },

    date:{
        type:Date,
        default: Date.now
    },

    payment:{
        type:String,
    },

    paymentStatus: {
        type: String,
        default: "Pending"
    },

    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            productName:{
                type: String
            },
            quantity: {
                type: Number,
                default: 1
            },
            productPrice: {
                type: Number,
            },
            totalPrice: {
                type: Number,
                default: 0
            },
            status: {
                type: String,
                default: "Order Placed"
            }
        }]

});

module.exports = mongoose.model("Order", orderSchema);