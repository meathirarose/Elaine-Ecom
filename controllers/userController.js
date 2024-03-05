const User = require("../models/userdbModel");
const bcrypt = require("bcrypt");
const otpController = require("./otpController");

// hashing password
const securePassword = async(password) => {
    try {
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        return passwordHash;

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
                res.redirect("/userHome");
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

                            otpController.sendOtpMail(req.body.name, req.body.email);

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
    userHomeLoad
}