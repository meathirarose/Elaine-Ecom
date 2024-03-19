const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({

products: [{

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },

    productQuantity: {
        type: Number,
        default: 0
    },

    totalAmount: {
        type: Number,
        default: 0
    }

}],

userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
},

totalCost: {
    type: Number,
    default: 0
}



});

module.exports = mongoose.model("Cart", cartSchema);