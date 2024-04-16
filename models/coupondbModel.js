const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    code: {
        type: String,
        required: true
    },

    minimumAmount: {
        type: Number,
        required: true
    },

    discount: {
        type: Number,
        required: true
    },

    validity: {
        type: Date,
        required: true
    }
})

module.exports = mongoose.model("Coupon", couponSchema);