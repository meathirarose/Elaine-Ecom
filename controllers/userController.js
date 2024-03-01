const User = require('../models/userdbModel');
const bcrypt = require('bcrypt');

// user login load
const userLoginLoad = async (req,res) =>{
    try {
        res.render("userLoginSignup");
    } catch (error) {
        console.log(error);
    }
}

// verify login
const verifyLogin = async (req,res) =>{
    try {
        const email = req.body.email;
        const password = req.body.password; 
        const userData = await User.findOne({email:email })
       if (userData) {
        const passwordMatch = await bcrypt.compare(password,userData.password)
        if(passwordMatch){
            req.session.user_id = userData._id;
            res.redirect("/userHome");
        }else{
            res.render("userLoginSignup");
            console.log("password incorrect");
        }
       }else{
            res.render("userLoginSignup");
       }
    } catch (error) {
        console.log(error);
    }
}

// hashing password
const securePassword = async(password) => {
    try {
        
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;

    } catch (error) {
        console.log(error);
    }
}

// user signup load
const userSignupLoad = async (req,res) => {

    try {
        res.render("userLoginSignup");
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

                        res.render("userLoginSignup");
                        console.log("mail already exists");

                    }else{

                        const secPassword = securePassword(req.body.password);
                        const user = new User({
                            name: req.body.name,
                            email: req.body.email,
                            mobile: req.body.mobile,
                            password: secPassword,
                            is_admin: 0

                        });

                        const userData = await user.save();
                        if(userData){
                            res.render("userHome");
                            console.log("reg succ");
                        }else{
                            res.render("userLoginSignup");
                            console.log("reg error");
                        }
                    }
                }else{
                    res.render("userLoginSignup");
                    console.log("wrong number");
                }
            }else{
                res.render("userLoginSignup");
                console.log("wrong email");
            }
        }else{
            res.render("userLoginSignup");
            console.log("wrong name");
        }
    } catch (error) {
        console.log(error);
    }
}











module.exports = {
    userLoginLoad,
    verifyLogin,
    userSignupLoad,
    verifySignup
}