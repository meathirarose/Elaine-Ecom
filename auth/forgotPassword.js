const User = require("../models/userdbModel");
const Otp = require("../models/otpdbModel");
const otpController = require("../auth/otpMailVerify");
const bcrypt = require("bcrypt");

// hashing password
const securePassword = async (password) => {
    try {

        const passwordHash = await bcrypt.hash(password, 10);

        return passwordHash;

    } catch (error) {
        console.log(error.message);
    }
}

// forgot mail verify
const forgotPasswordEmailLoad = async (req, res) => {
    
    try {

        res.render("forgotPasswordEmail");

    } catch (error) {
        console.log(error.message);
    }

}

// verify forgot email and otp page
const verifyForgotEmail = async (req, res) => {

    try {
        const email = req.body.email;
        const checkAlreadyMail = await User.findOne({ email: req.body.email });

        if(checkAlreadyMail){
            if(checkAlreadyMail.is_verified === 1){
                await otpController.sendOtpMail(email);
                req.session.email = req.body.email;
                res.redirect("/verifyOtpForgot");
            }
        } 

    } catch (error) {
        console.log(error.message);
    }    

}

// verifyOtp load
const verifyOtpForgotLoad = async (req, res) => {

    try {

        res.render("verifyOtpForgot");
        
    } catch (error) {
        console.log(error.message);
    }

}


// otp verification
const verifyOtpForgot = async (req, res) =>{
    
    try {
        
        const {otp1,otp2,otp3,otp4,otp5,otp6} = req.body;

        const otpNo = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`
        
        const otpData = await Otp.findOne({email: req.session.email});

        if(otpData && otpData.otp === parseInt(otpNo)){

            await User.updateOne({email:req.session.email},{is_verified: 1});
            
            res.render("forgotPassword");

        }else{
            res.render("verifyOtp", {message: "Invalid Otp"});
        }

    } catch (error) {

        console.log(error.message);
        res.render("verifyOtp",{ message: "An error occured"});   
           
    }
}

// forgot password load
const forgotPasswordLoad = async (req, res) => {

    try {

        res.render("forgotPassword");

    } catch (error) {
        console.log(error.message);
    }

}

// resetting password
const updatePassword = async (req, res) => {

    try {
        
        const email = req.session.email;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        if(newPassword === confirmPassword){

            const secPassword = await securePassword(confirmPassword);
            await User.updateOne({email: email}, {password: secPassword});
            res.redirect("userLogin");

        }else{
            res.render("forgotPassword", {message: "Incorrect Password"});
        }

    } catch (error) {
        console.log(error.message);
    }

}




module.exports = {
    forgotPasswordEmailLoad,
    verifyForgotEmail,
    verifyOtpForgotLoad,
    forgotPasswordLoad,
    updatePassword,
    verifyOtpForgot
}