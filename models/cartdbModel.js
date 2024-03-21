const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({

products: [{

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },

    quantity: {
        type: Number
    },

    productPrice: {
        type: Number
    },

    totalPrice: {
        type: Number
    }

}],

userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
},

totalCost: {
    type: Number
}



});

module.exports = mongoose.model("Cart", cartSchema);