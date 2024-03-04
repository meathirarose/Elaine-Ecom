const User = require("../models/userdbModel");
const Otp = require("../models/otpdbModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// hashing password
const securePassword = async(password) => {
    try {
        
        const passwordHash = await bcrypt.hash(password,10);
        
        return passwordHash;

    } catch (error) {
        console.log(error.message);
    }
}

// for generate otp
function generateOtp(){

    let digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    let otp = "";
    for(let i=0;i<6;i++){
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
        })

    } catch (error) {
        console.log(error.message);
    }
}

//user load page
const userLoadPage = async (req, res) => {
    try {
        
        res.render("userLoadPage");

    } catch (error) {
        console.log(error.message);
    }
}

// user login load
const userLoginLoad = async (req,res) =>{
    try {

        res.render("userLogin");

    } catch (error) {
        console.log(error.message);
    }  
}

// verify login
const verifyLogin = async (req,res) =>{
    try {
        const email = req.body.email;
        const password = req.body.password; 
        const userData = await User.findOne({email:email });

       if (userData) {

        const passwordMatch = await bcrypt.compare(password, userData.password)
        if(passwordMatch){
            req.session.user_id = userData._id;
            res.redirect("userHome");

        }else{

            res.render("userLogin", {message: "Incorrect Email and Password.!"});

        }
       }else{
            res.render("userLogin", {message: "Incorrect Email and Password.!"});
       }
    } catch (error) {
        console.log(error.message);
    }
}

// user signup load
const userSignupLoad = async (req,res) => {
    try {
        res.render("userSignup");
    } catch (error) {
        console.log(error.message);
    }
}

// user signUp verification
const verifySignup = async (req,res) => {
    try {
        if(/^[a-zA-Z][a-zA-Z\s]*$/.test(req.body.name)){

            if(/^[a-zA-Z0-9._%+-]+@(?:gmail|yahoo).com$/.test(req.body.email)){

                if(/^\d{10}$/.test(req.body.mobile)){

                    const checkAlreadyMail = await User.findOne({email:req.body.email});
                    if(checkAlreadyMail){

                        res.render("userSignup", {message:"Email already exists.!"});
                        }else{

                        const secPassword =await securePassword(req.body.password);
                       
                        const user = new User({
                            name: req.body.name,
                            email: req.body.email,
                            mobile: req.body.mobile,
                            password: secPassword,
                            is_verified: 0
                            
                        });

                        const userData = await user.save();
                        if(userData){
                            sendOtpMail(req.body.name, req.body.email);
                            req.session.email = req.body.email;
                            req.session.user_id = req.body.userData_id;
                            res.redirect("/verifyOtp");
                           
                        }else{
                            res.render("userSignup", {message: "Registration failed.!"});
                        }
                    }
                }else{
                    res.render("userSignup", {message: "Enter a valid mobile number.!"});
                }
            }else{
                res.render("userSignup", {message: "Enter a valid email.!"});
               
            }
        }else{
            res.render("userSignup", {message: "Enter a valid name.!"});
           
        }
    } catch (error) {
        console.log(error.message);
    }
}

// otp verification
const verifyOtp = async (req, res) =>{
    
    try {
        
        const {otp1,otp2,otp3,otp4,otp5,otp6} = req.body;

        const otpNo = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`
        
        const email = req.session.email;
        console.log(email);
        const otpData = await Otp.findOne({email: req.session.email});
        console.log(parseInt(otpNo));
        if(otpData && otpData.otp === parseInt(otpNo)){
            console.log(email);
            const result = await User.updateOne({email:req.session.email},{is_verified: 1});
            console.log(result);
            res.render("userHome");


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
        const email = req.query.email; 
        res.render("verifyOtp",{email});

    } catch (error) {
        console.log(error.message);
    }
}

// home load
const userHomeLoad = async (req,res) =>{
    try {

        res.render("userHome");

    } catch (error) {
        console.log(error.message);
    }
}











module.exports = {
    userLoadPage,
    userLoginLoad,
    verifyLogin,
    userSignupLoad,
    verifySignup,
    verifyOtpLoad,
    verifyOtp,
    userHomeLoad
}