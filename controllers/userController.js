const User = require("../models/userdbModel");
const bcrypt = require("bcrypt");

// hashing password
const securePassword = async(password) => {
    try {
        
        const passwordHash = await bcrypt.hash(password,10);
        
        return passwordHash;

    } catch (error) {
        console.log(error);
    }
}

//user load page
const userLoadPage = async (req, res) => {
    try {
        
        res.render("userLoadPage");

    } catch (error) {
        console.log(error);
    }
}

// user login load
const userLoginLoad = async (req,res) =>{

    try {

        res.render("userLogin");

    } catch (error) {
        console.log(error);
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

            res.render("userLogin");

        }
       }else{
            res.render("userLogin");
       }
    } catch (error) {
        console.log(error);
    }
}

// user signup load
const userSignupLoad = async (req,res) => {

    try {
        res.render("userSignup");
    } catch (error) {
        console.log(error);
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

                        res.render("userSignup");
                        }else{

                        const secPassword =await securePassword(req.body.password);
                       
                        const user = new User({
                            name: req.body.name,
                            email: req.body.email,
                            mobile: req.body.mobile,
                            password: secPassword
                            
                        });

                        const userData = await user.save();
                        if(userData){
                            res.redirect("/verifyOtp");
                           
                        }else{
                            res.render("userSignup");
                            
                        }
                    }
                }else{
                    res.render("userSignup");
                }
            }else{
                res.render("userSignup");
               
            }
        }else{
            res.render("userSignup");
           
        }
    } catch (error) {
        console.log(error);
    }
}

// load otp verification
const verifyOtpLoad = async (req, res) =>{

    try {
        
        res.render("verifyOtp");

    } catch (error) {
        console.log(error.message);
    }

}



// home load
const userHomeLoad = async (req,res) =>{

    try {

        res.render("userHome");

    } catch (error) {
        console.log(error);
    }

}











module.exports = {
    userLoadPage,
    userLoginLoad,
    verifyLogin,
    userSignupLoad,
    verifySignup,
    verifyOtpLoad,
    userHomeLoad
}