const User = require("../../models/userdbModel");
const Product =require("../../models/productdbModel");
const Order = require("../../models/orderdbSchema");
const Coupon = require("../../models/coupondbModel");
const Category = require("../../models/categorydbModel");
const bcrypt = require("bcrypt");
const otpController = require("../../auth/otpMailVerify")

// hashing password
const securePassword = async (password) => {
    try {

        const passwordHash = await bcrypt.hash(password, 10);

        return passwordHash;

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

//user load page
const userLoadPage = async (req, res) => {
    try {

        res.render("userLoadPage");

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

// user login load
const userLoginLoad = async (req, res) => {
    try {

        res.render("userLogin");

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

// verify login
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });

        if (userData ) {
            if(userData.is_blocked === false){
            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {
                if (userData.is_verified === 0) {

                    res.render("userLogin", { message: "Your account is not verified..!" });

                } else {
                    req.session.user_id = userData._id;
                    res.redirect("/userHome");
                }

            } else {
                res.render("userLogin", { message: "Please check your password" });
            }
        }else{
            res.render("userLogin", {message: "Access Restricted"});
        }
        } else {
            res.render("userLogin", { message: "Incorrect mail and passeword" });
        }
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}


// user signup load
const userSignupLoad = async (req, res) => {
    try {

        res.render("userSignup");

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

// user signUp verification
const verifySignup = async (req, res) => {
    try {
        if (/^[a-zA-Z][a-zA-Z\s]*$/.test(req.body.name)) {

            if (/^[a-zA-Z0-9._%+-]+@(?:gmail|yahoo).com$/.test(req.body.email)) {

                if (/^\d{10}$/.test(req.body.mobile)) {

                    const checkAlreadyMail = await User.findOne({ email: req.body.email });

                    if (checkAlreadyMail) {

                        if (checkAlreadyMail.is_verified === 1) {

                            res.render("userSignup", { message: "Email already exists.!" });

                        }else{

                            await otpController.sendOtpMail( req.body.email);
                            await otpController.resendOtpMail( req.body.email);
                            req.session.email = req.body.email;
                            req.session.name = checkAlreadyMail.name;

                            res.redirect("/verifyOtp");

                        }
                    } else {

                        const secPassword = await securePassword(req.body.password);

                        const user = new User({
                            name: req.body.name,
                            email: req.body.email,
                            mobile: req.body.mobile,
                            password: secPassword,
                            is_verified: 0
                        });

                        const userData = await user.save();

                        if (userData) {

                            await otpController.sendOtpMail(req.body.email);
                            await otpController.resendOtpMail( req.body.email);

                            req.session.email = req.body.email;
                            req.session.name = userData.name;

                            res.redirect("/verifyOtp");

                        } else {
                            res.render("userSignup", { message: "Registration failed.!" });
                        }
                    }
                } else {
                    res.render("userSignup", { message: "Enter a valid mobile number.!" });
                }
            } else {
                res.render("userSignup", { message: "Enter a valid email.!" });

            }
        } else {
            res.render("userSignup", { message: "Enter a valid name.!" });

        }
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

// google authentication success
const successGoogleLogin = async (req, res) =>{
    try {

        const name = req.user.displayName;
        const email = req.user.emails[0].value;
        const googleId = req.user.id
        
        const userData = await User.findOne({email:email});
        if(userData){

            req.session.user_id = userData._id;
            res.redirect("/userHome");

        }else{
            
            const secPassword = await securePassword(googleId);
            
            const user = new User({
                name: name,
                email: email,
                googleId: secPassword,
                is_verified: 1
                
            });

            const newUser = await user.save();
            if(newUser){
                req.session.user_id = newUser._id;
                res.redirect("/userHome");
            }
        }     
        
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

// google authentication failed
const failureGoogleLogin = async (req, res) =>{
    try {

        res.render("userLogin", {message: "Some error occured..!"});
        
    } catch (error) {
        console.log(error.message);
    }
}

// home load
const userHomeLoad = async (req, res) => {
    try {

        const productData = await Product.find({})
                            .populate([
                                { path: 'categoryId' },
                                { path: 'offer' }
                            ]);
        const sortedProductData = productData.sort((a,b) => b.createdOn - a.createdOn);
        res.render("userHome", {productData: sortedProductData});

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}


// contact us page load
const contactUsLoad = async (req, res) => {

    try {
        
        res.render("contactUs");

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}
// -------------------------------------- my account starts here ---------------------------------------------------//

// my account load
const myAccountLoad = async (req, res) => {
    try {
        const userId = req.session.user_id;

        // for pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3; 
        const skip = (page - 1) * limit;

        const userData = await User.findById(userId);
        let orderData = await Order.find({ userId })
            .populate('products.productId')
            .sort({date: -1})
            .skip(skip)
            .limit(limit);
        
        // display order
        for (let i = 0; i < orderData.length; i++) {
            const order = orderData[i];

            let totalPrice = 0;

            for (const product of order.products) {
                const productData = await Product.findById(product.productId);
                
                product.productName = productData.prdctName;
                product.productPrice = productData.prdctPrice;

                totalPrice += product.totalPrice;
            }

            order.totalAmount = totalPrice;
        }

        // for pagination
        const totalOrders = await Order.countDocuments({ userId });
        const totalPages = Math.ceil(totalOrders / limit);

        const couponData = await Coupon.find({});

        res.render("myAccount", { 
            userData, 
            orderData, 
            couponData, 
            currentPage: page, 
            totalPages
             
        });

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
};


// add and save address

const saveAddress = async (req, res) => {
    try {
        const {
            fullname,
            addressline,
            city,
            state,
            email,
            pincode,
            phone
        } = req.body;

        if (!fullname || !/^[a-zA-Z][a-zA-Z\s]*$/.test(fullname)) {
            return res.json({message: "Enter a valid Name"});
        }
        if (!addressline || !/^[a-zA-Z][a-zA-Z\s]*$/.test(addressline)) {
            return res.json({message: "Enter a valid Street Address"});
        }
        if (!city || !/^[a-zA-Z][a-zA-Z\s]*$/.test(city)) {
            return res.json({message: "Enter a valid City Name"});
        }
        if (!state || !/^[a-zA-Z][a-zA-Z\s]*$/.test(state)) {
            return res.json({message: "Enter a valid State Name"});
        }
        if (!email || !/^[a-zA-Z0-9._%+-]+@(?:gmail|yahoo).com$/.test(email)) {
            return res.json({message: "Enter a valid Email"});
        }
        if (!pincode || !/^\d{6}$/.test(pincode)) {
            return res.json({message: "Enter a valid Pincode"});
        }
        if (!phone || !/^\d{10}$/.test(phone)) {
            return res.json({message: "Enter a valid Mobile Number"});
        }

        await User.findByIdAndUpdate(
            {
                _id: req.session.user_id
            },
            {
                $push: {
                    address: {
                        fullname: fullname,
                        addressline: addressline,
                        city: city,
                        state: state,
                        email: email,
                        pincode: pincode,
                        phone: phone
                    }
                }
            }
        );

        return res.json({ message: 'Address saved successfully' });
        
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}


// edit address
const editAddress = async (req, res) => {
    try {
        const editAddressId = req.params.id;
        const userId = req.session.user_id;
        
        const {
            fullname,
            addressline, 
            city,
            state,
            email,
            pincode,
            phone
            
        } = req.body;

        if(!/^[a-zA-Z][a-zA-Z\s]*$/.test(fullname)){
            return res.json({message:"Enter a valid Name"});
        }
        if(!/^[a-zA-Z][a-zA-Z\s]*$/.test(addressline)){
            return res.json({message: "Enter a valid Street Address"});
        }
        if(!/^[a-zA-Z][a-zA-Z\s]*$/.test(city)){
            return res.json({message: "Enter a valid City"});
        }
        if(!/^[a-zA-Z][a-zA-Z\s]*$/.test(state)){
            return res.json({message: "Enter a valid State"});
        }
        if(!/^[a-zA-Z0-9._%+-]+@(?:gmail|yahoo).com$/.test(email)){
            return res.json({message: "Enter a valid Email"});
        }
        if(!/^\d{6}$/.test(pincode)){
            return res.json({message: "Enter a valid Pincode"});
        }
        if(!/^\d{10}$/.test(phone)){
            return res.json({message: "Enter a valid Mobile Number"});
        }

        await User.findOneAndUpdate(
            {
                _id: userId,
                "address._id": editAddressId
            },
            {
                $set:{
                    "address.$.fullname": fullname,
                    "address.$.addressline": addressline,
                    "address.$.city": city,
                    "address.$.state": state,
                    "address.$.email": email,
                    "address.$.pincode": pincode,
                    "address.$.phone": phone
                }
            });

            return res.json({ message: 'Address updated successfully' });

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

// remove Address
const removeAddress = async (req, res) => {
    try {
        
        const addressId = req.body.addressId;
        
        const userData = await User.findOneAndUpdate(
            {"address._id": addressId},
            {$pull:{address:{_id:addressId}}}
        );

        if (!userData) {
            return res.json({ message: 'User not found' });
        }

        res.json({ message: 'Address removed successfully' });


    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// change password
const changePassword = async (req, res) => {

    try {
        
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        //current and new are same
        if(currentPassword === newPassword){

            return res.json({ message: "New password cannot be the same as current password." });

        }else{
            if(newPassword === confirmPassword){

                const secPassword = await securePassword(confirmPassword);
                await User.updateOne({_id: req.session.user_id}, {password: secPassword});
                res.json({message: 'Password saved successfully'});
                location.reload();

            }else{

                return res.json({ message: "Current or new password is incorrect."});

            }
        }

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}
// -------------------------------------- my account starts here ---------------------------------------------------//



// logout user
const userLogout = async (req, res) => {
    try {

        req.session.destroy();
        res.redirect("/");

    } catch (error) {
        console.log(error.message);
    }
}

// page not found
const pageNotFound = async (req, res) => {

    try {
        
        res.render("404");

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
    successGoogleLogin,
    failureGoogleLogin,
    userHomeLoad,
    contactUsLoad,
    myAccountLoad,
    saveAddress,
    editAddress,
    removeAddress,
    changePassword,  
    pageNotFound,
    userLogout
}