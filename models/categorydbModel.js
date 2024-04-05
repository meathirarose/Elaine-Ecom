const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({

    cateName: {
        type: String,
        unique: true,
    },

    cateDescription: {
        type: String,
    },

    is_listed: {
        type: Boolean,
        default: true
    }

});


module.exports = mongoose.model("Category", categorySchema);