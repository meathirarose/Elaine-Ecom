const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    offerPercentage: {
        type: Number,
        required: true
    },

    validity: {
        type: Date,
        required: true
    },

    status: {
        type: Boolean,
        required: true,
        default: true
    },

    type: {
        type: String,
        required: true
    },

    typeName: {
        type: String,
        required: true
    }

})


module.exports = mongoose.model("Offer", offerSchema);