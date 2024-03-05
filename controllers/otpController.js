const User = require("../models/userdbModel");
const Otp = require("../models/otpdbModel");
const nodemailer = require("nodemailer");

// for generate otp
function generateOtp(){

    let digits = "1234567890";
    let otp = "";
    
    for(let i=0; i<6; i++){
        otp += digits[Math.floor(Math.random()*10)];
    }
    return otp;

}

// for sending mail
const sendOtpMail = async (name, email) =>{

    try {
        const otp = generateOtp();
        
        const otpData = new Otp({
            email: email,
            otp: otp
        });
        await otpData.save();
        
        const transporter = await nodemailer.createTransport({
        
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth:{
                user: "meathirarosejohn@gmail.com",
                pass: "eope wdql bgin qwuz"
            }
        });

        const mailOptions = {
            from: "meathirarosejohn@gmail.com",
            to: email,
            subject: "Verify your mail using OTP",
            text: `Hi ${name}, Please verify your mail using this otp ${otp}.`
        }

        transporter.sendMail(mailOptions, (error,info) =>{
            if(error){
                console.log(error);
            }else{
                console.log("Email has been sent:-"+info.response);
            }
        });

    } catch (error) {
        console.log(error.message);
    }
}

// otp verification
const verifyOtp = async (req, res) =>{
    
    try {
        
        const {otp1,otp2,otp3,otp4,otp5,otp6} = req.body;

        const otpNo = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`
        
        const otpData = await Otp.findOne({email: req.session.email});

        if(otpData && otpData.otp === parseInt(otpNo)){

            await User.updateOne({email:req.session.email},{is_verified: 1});
            res.render("userLogin");

        }else{
            res.render("verifyOtp", {message: "Invalid Otp"});
        }

    } catch (error) {
        console.log(error.message);
        res.render("verifyOtp",{message: "An error occured"});      
    }
}

// load otp page 
const verifyOtpLoad = async (req, res) =>{
    try {

        res.render("verifyOtp");

    } catch (error) {
        console.log(error.message);
    }
}








module.exports = {
    verifyOtpLoad,
    verifyOtp,
    sendOtpMail
}