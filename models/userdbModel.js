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
        default: ""
    },

    password:{
        type: String,
        default: ""
    },

    is_verified:{
        type: Number,
        default: 0
    },

    is_blocked:{
        type: Boolean,
        default: false
    },

    is_admin:{
        type: Number,
        default: 0
    },

    googleId:{
        type: String,
        default: " "
    },

    referralCode: {
        type: String
    },

    wallet: {
        type: Number,
        default: 0
    },

    walletHistory: [
        {
        date:{
            type: Date
        },
        amount: {
            type: Number,
            default: 0
        },
        reason: {
            type: String
        },
        status: {
            type: String
        }
    }],

    address: [
        {
            fullname:{
                type:String
            },
            
            addressline:{
                type:String
            },
            
            city:{
                type:String
            },
            
            state:{
                type:String
            },

            email:{
                type:String
            },
            
            pincode:{
                type:Number
            },

            phone:{
                type:Number
            }
    
        }]

});

module.exports = mongoose.model('User',userSchema);