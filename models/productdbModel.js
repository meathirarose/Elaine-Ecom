const mongoose = require("mongoose");

const productSchema = mongoose.Schema({

    prdctName: {
        type: String,
        default: ""
    },

    prdctDescription: {
        type: String,
        default: " "
    },

    prdctPrice: {
        type: Number
    },

    prdctQuantity:{
        type: Number,
        default: 1
    },

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },

    prdctImage: {
        type: Array,
    },

    is_listed: {
        type: Boolean,
        default: true
    }

});

module.exports = mongoose.model("Product", productSchema);