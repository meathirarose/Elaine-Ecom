const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true
    },

    email:{
        type: String,
        required: true
    },

    mobile:{
        type: String,
        default: " "
    },

    password:{
        type: String,
        default: " "
    },

    is_verified:{
        type: Number,
        default: 0
    },

    is_admin:{
        type: Number,
        default: 0
    },
    googleId:{
        type: String,
        default: " "
    },
    address: {
        type: String,
        default: " "
    }

});

module.exports = mongoose.model('User',userSchema);