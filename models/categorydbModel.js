const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({

    cateName: {
        type: String,
        unique: true,
        default: " "
    },

    cateDescription: {
        type: String,
        default: " "
    },

    is_listed: {
        type: Boolean,
        default: true
    }

});


module.exports = mongoose.model("Category", categorySchema);