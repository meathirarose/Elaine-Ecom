const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    deliveryAddress : {
        type: String,
    },

    userName: {
        type: String
    },

    totalAmount:{
        type:Number,
    },

    date:{
        type:String,
    },

    payment:{
        type:String,
    },

    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',

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
                default: "placed"
            }
        }]

});

module.exports = mongoose.model("Order", orderSchema);