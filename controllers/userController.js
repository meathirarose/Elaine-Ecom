const User = require("../models/userdbModel");
const Product =require("../models/productdbModel");
const Cart = require("../models/cartdbModel");
const bcrypt = require("bcrypt");
const otpController = require("../auth/otpMailVerify")

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

        res.render("userHome");

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}

// all product list
const allProductsListLoad = async (req, res) => {

    try {
        
        const productsData = await Product.find({});
        res.render("products", {productsData});

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// product details load
const productDetailsLoad = async (req, res) => {

    try {

        const productId = req.query.productId;

        //for getting the product data with the particular id
        const productDatabyId = await Product.findById({ _id: productId });

        // for getting product images only without id 
        const productImagebyId = await Product.findById({ _id: productId },{prdctImage:1, _id:0});

        // for getting the images only as an array
        const productImagesArray = productImagebyId.prdctImage.map(image => `${image}`);

        res.render("productDetails", {productDatabyId, productImagebyId, productImagesArray});

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
        const userData = await User.findById(userId);
        res.render("myAccount", {userData});

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

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

        const errors = [];

        if (!fullname || !/^[a-zA-Z][a-zA-Z\s]*$/.test(fullname)) {
            errors.push("Enter a valid Name");
        }
        if (!addressline || !/^[a-zA-Z][a-zA-Z\s]*$/.test(addressline)) {
            errors.push("Enter a valid Address");
        }
        if (!city || !/^[a-zA-Z][a-zA-Z\s]*$/.test(city)) {
            errors.push("Enter a valid City");
        }
        if (!state || !/^[a-zA-Z][a-zA-Z\s]*$/.test(state)) {
            errors.push("Enter a valid State");
        }
        if (!email || !/^[a-zA-Z0-9._%+-]+@(?:gmail|yahoo).com$/.test(email)) {
            errors.push("Enter a valid Email");
        }
        if (!pincode || !/^\d{6}$/.test(pincode)) {
            errors.push("Enter a valid Pincode");
        }
        if (!phone || !/^\d{10}$/.test(phone)) {
            errors.push("Enter a valid Mobile Number");
        }

        if (errors.length > 0) {
            res.status(400).json({ errors: errors }); // Sending 400 status for validation errors
        } else {
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

            res.json({ message: 'Address saved successfully' });
        }
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
            res.json({message:"Enter a valid Name"});
        }
        if(!/^[a-zA-Z][a-zA-Z\s]*$/.test(addressline)){
            res.json({message: "Enter a valid Address"});
        }
        if(!/^[a-zA-Z][a-zA-Z\s]*$/.test(city)){
            res.json({message: "Enter a valid City"});
        }
        if(!/^[a-zA-Z][a-zA-Z\s]*$/.test(state)){
            res.json({message: "Enter a valid State"});
        }
        if(!/^[a-zA-Z0-9._%+-]+@(?:gmail|yahoo).com$/.test(email)){
            res.json({message: "Enter a valid Email"});
        }
        if(!/^\d{6}$/.test(pincode)){
            res.json({message: "Enter a valid Pincode"});
        }
        if(!/^\d{10}$/.test(phone)){
            res.json({message: "Enter a valid Mobile Number"});
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

            res.json({success: true})

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
// ---------------------------------------- cart starts here -----------------------------------------------------//
// cart load
const cartLoad = async (req, res) => {
    try {


        const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');
        console.log(cartData, "---------------------------------------------cartData------------------------------------------------");
        cartData.products.forEach(product => {
            product.updatedTotalPrice = product.quantity * product.productPrice;
        });

        res.render("cart" ,{cartData:cartData});

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// add products to cart
const addProductsToCart = async (req, res) => {

    try {

        const productId = req.query.productId;
        console.log(productId);
        //for getting the product data with the particular id
        const productDatabyId = await Product.findById({ _id: productId });
        console.log(productDatabyId, "---------------------------------------productDatabyId--------------------------------------------");
        // for getting product images only without id 
        const productImagebyId = await Product.findById({ _id: productId },{prdctImage:1, _id:0});

        // for getting the images only as an array
        const productImagesArray = productImagebyId.prdctImage.map(image => `${image}`);

        const cartData = await Cart.findOne({userId: req.session.user_id});
        
        if (cartData) {
            
            const alreadyExist = cartData.products.find((pro) => pro.productId.toString() == productId);
            if (alreadyExist) {
                // If the product already exists in the cart, set the price
                // await Cart.findOneAndUpdate({
                //     userId: req.session.user_id,
                //     "products.productId": productId
                // },{
                //     $inc: {
                //     "products.$.quantity": quantity,
                //     }
                // });
                console.log("product is already in the cart");
            } else {
                // If the product doesn't exist in the cart, add it
                await Cart.findOneAndUpdate({
                    userId: req.session.user_id
                }, {
                    $push: {
                        products: {
                            productId: productId,
                            quantity: 1, 
                            productPrice: productDatabyId.prdctPrice,
                            totalPrice: productDatabyId.prdctPrice 
                        }
                    }
                });
            }
        } else {
            // If the user doesn't have a cart yet, create a new cart and add the product to it
            const newCart = new Cart({
                products: [{
                    productId: productId,
                    quantity: 1, 
                    productPrice: productDatabyId.prdctPrice,
                    totalPrice: productDatabyId.prdctPrice
                }],
                userId: req.session.user_id,
                totalCost: 0
            });

            await newCart.save();
        }      
        res.redirect("/products");

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// update cart quantity
const updateCartQuantity = async (req, res) =>{

    try {
        
        const productId = req.params.productId;
        const { quantity } = req.body;

        const productDataById = await Product.findById(productId);

        await Cart.findOneAndUpdate(
            { 
                userId: req.session.user_id,
                "products.productId": productId 
            }, 
            { 
                $set: { 
                    "products.$.quantity": quantity,
                    "products.$.productPrice": productDataById.prdctPrice,
                    "products.$.totalPrice": quantity * productDataById.prdctPrice
                }
            }
        );

        const updatedCartData = await Cart.findOne(
            { 
                userId: req.session.user_id,
                "products.productId": productId 
            }
        );

        const totalCost = updatedCartData.products.reduce((accumulator, product) => {
            return accumulator + product.totalPrice;
        }, 0);

        updatedCartData.totalCost = totalCost;
        await updatedCartData.save();

        const updatedProduct = updatedCartData.products.find(product => product.productId == productId);
            res.json({ 
            success: true, 
            updatedTotalPrice: updatedProduct.totalPrice,
            totalCost: totalCost 
        });
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// delete cart elements
const deleteCartItem = async (req, res) => {
    try {
        const productId = req.params.productId;

        await Cart.findOneAndUpdate(
            {
                userId: req.session.user_id
            },
            {
                $pull: { products: { productId: productId } }
            }
        );

        const updatedCartData = await Cart.findOne({ userId: req.session.user_id });
        const totalCost = updatedCartData.products.reduce((accumulator, product) => {
            return accumulator + product.totalPrice;
        }, 0);

        updatedCartData.totalCost = totalCost;
        await updatedCartData.save();

        res.json({ success: true, totalCost: totalCost });
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
};
// ---------------------------------------- cart ends here -----------------------------------------------------//

// load checkout page
const checkoutLoad = async (req, res) => {

    try {
        
        const userDataCheckout = await User.findById(
            {
                _id: req.session.user_id
            }
        );
        const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');

        res.render("checkout", {userDataCheckout, cartData});

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// load place order
const placeOrderLoad = async (req, res) => {

    try {
        
        const userDataCheckout = await User.findById(
            {
                _id: req.session.user_id
            }
        );
        const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');

        res.render("placeOrder", {userDataCheckout, cartData});

    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

// Place order
const placeOrder = async (req, res) => {
    try {
        // Retrieve selected address ID from request body
        const selectedAddressId = req.body.selectedAddressId; // Adjust this line if necessary
        console.log(selectedAddressId, "-------------------------------------------selectedAddressId----------------------------------------------");
        // Retrieve other order details from request body
        //const { /* other order details */ } = req.body;

        // Use the selected address ID and other order details to place the order
        // Example logic to place the order...

        res.status(200).json({ message: 'Order placed successfully' });
    } catch (error) {
        console.log(error.message);
        res.render("404");
    }
}


// const order details load
const orderDetailsLoad = async (req, res) => {

    try {
        
        const userDataCheckout = await User.findById(
            {
                _id: req.session.user_id
            }
        );
        const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');

        res.render("orderDetails", {userDataCheckout, cartData});


    } catch (error) {
        console.log(error.message);
        res.render("404");
    }

}

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
    allProductsListLoad,
    productDetailsLoad,
    addProductsToCart,
    updateCartQuantity,
    deleteCartItem,
    contactUsLoad,
    myAccountLoad,
    saveAddress,
    editAddress,
    removeAddress,
    changePassword,
    cartLoad,
    checkoutLoad,
    placeOrderLoad,
    placeOrder,
    orderDetailsLoad,
    pageNotFound,
    userLogout
}