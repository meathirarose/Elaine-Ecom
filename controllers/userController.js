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
const userLoginLoad = async (req, res) => {
    try {

        res.render("userLogin");

    } catch (error) {
        console.log(error.message);
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
    }
}

// user signup load
const userSignupLoad = async (req, res) => {
    try {

        res.render("userSignup");

    } catch (error) {
        console.log(error.message);
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

                            await otpController.sendOtpMail(req.body.name, req.body.email);
                            await otpController.resendOtpMail(req.body.name, req.body.email);
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

                            await otpController.sendOtpMail(req.body.name, req.body.email);
                            await otpController.resendOtpMail(req.body.name, req.body.email);

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
    }
}

// all product list
const allProductsListLoad = async (req, res) => {

    try {
        
        const productsData = await Product.find({});
        res.render("products", {productsData});

    } catch (error) {
        console.log(error.message);
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
    }

}

// contact us page load
const contactUsLoad = async (req, res) => {

    try {
        
        res.render("contactUs");

    } catch (error) {
        console.log(error.message);
    }

}

// my account load
const myAccountLoad = async (req, res) => {

    try {
        
        const userId = req.session.user_id;
        const userData = await User.findById(userId);
        res.render("myAccount", {userData});

    } catch (error) {
        console.log(error.message);
    }

}

// add and save address
const saveAddress = async (req, res) => {

    try {

        const {
            fullname,
            addressline, 
            addressline2,
            city,
            state,
            email,
            pincode,
            phone
            
        } = req.body;

        await User.findByIdAndUpdate(
            { 
                _id:req.session.user_id 
            },
            {
                $push:{
                    address:{
                        fullname: fullname,
                        addressline: addressline,
                        addressline2: addressline2,
                        city: city,
                        state: state,
                        email: email,
                        pincode: pincode,
                        phone: phone
                    }
                }
            });

            res.json({success:true});

    } catch (error) {
        console.log(error.message);
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
    }

}


// cart load
const cartLoad = async (req, res) => {
    try {


            const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');
           
            res.render("cart" ,{cartData:cartData});

    } catch (error) {
        console.log(error.message);
    }

}

// add products to cart
const addProductsToCart = async (req, res) => {

    try {

        const productId = req.query.productId;
        console.log(productId);
        //for getting the product data with the particular id
        const productDatabyId = await Product.findById({ _id: productId });
        
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
    }

}

// update cart quantity
const updateCartQuantity = async (req, res) =>{

    try {
        
        const productId = req.params.productId;

        const productDatabyId = await Product.findById({ _id: productId });

        const quantity = req.body.quantity;
        await Cart.findOneAndUpdate(
            { 
                userId: req.session.user_id,
                "products.productId": productId 
            }, 
            {$set: 
                { "products.$.quantity": quantity,
                  "products.$.productPrice" : productDatabyId.prdctPrice,
                  "products.$.totalPrice" : quantity * productDatabyId.prdctPrice,
                  "products.$.totalCost" : 0
            }
        });
       
        const updatedCartData = await Cart.findOne(
            { 
                userId: req.session.user_id,
                "products.productId": productId 
            }
        )

        const totalPrice =  updatedCartData.products.find(product=> {

           if(product.productId == productId){
            return product.totalPrice
           }

        });

        const totalCost = updatedCartData.products.reduce((accumulator, product) => {

            return accumulator + product.totalPrice;

        }, 0);

        updatedCartData.totalCost = totalCost;
        await updatedCartData.save();

        res.json({success: true, updatedTotalPrice:totalPrice, totalCost: totalCost});

    } catch (error) {
        console.log(error.message);
    }

}

// delete cart elements
const deleteCartItem = async (req, res) => {

    try {
        
        const userId = req.session.user_id;
        const productId = req.params.productId;

        const cartData = await Cart.findOne({userId: userId});

        if(cartData){

            await Cart.findOneAndUpdate(
                {
                    userId: userId
                },
                {
                    $pull:  { products:{productId:productId}}
                });
        }

        res.json({success: true})
        
    } catch (error) {
        console.log(error.message);
    }

}

// load checkout page
const checkoutLoad = async (req, res) => {

    try {
        
        const userDataCheckout = await User.findById(
            {
                _id: req.session.user_id
            }
        );
        const cartData = await Cart.findOne({userId: req.session.user_id}).populate('products.productId');
        console.log(cartData);

        res.render("checkout", {userDataCheckout, cartData});

    } catch (error) {
        console.log(error.message);
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
    cartLoad,
    checkoutLoad,
    placeOrderLoad,
    orderDetailsLoad,
    userLogout
}