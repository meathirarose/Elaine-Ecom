const Product = require("../../models/productdbModel");
const Cart = require("../../models/cartdbModel");
const Coupon = require("../../models/coupondbModel");

// render coupon page
const couponLoad = async (req, res) =>{

    try {

        const couponData = await Coupon.find({});
        res.render("coupons",{couponData: couponData});
        
    } catch (error) {
        console.log(error.message);
    }

}

// add coupon load
const addCouponLoad = async (req, res) => {

    try {
        
        res.render("addCoupon");

    } catch (error) {
        console.log(error.message);
    }

}

// add coupon
const addCoupons = async (req, res) =>{

    try {
        
        const name = req.body.couponName;
        const description = req.body.couponDescription;
        const code = req.body.couponCode;
        const validity = new Date(req.body.couponValidity);
        const currentDate = new Date();
        const minimumAmount = req.body.minimumPurchaseAmount;
        const discount = req.body.couponDiscount;

        if(!name || /^\s*$/.test(name)){
            return res.render("addCoupon", {message: "Enter a valid coupon name"});
        }

        if(!description || /^\s*$/.test(description)){
            return res.render("addCoupon", {message: "Enter a valid coupon description"});
        }

        if(!code || /^\s*$/.test(code)){
            return res.render("addCoupon", {message: "Enter a valid coupon code"});
        }

        if(!validity || validity < currentDate){
            return res.render("addCoupon", {message: "Enter a valid date"});
        }

        if(!minimumAmount || minimumAmount <= 0){
            return res.render("addCoupon", {message: "Minimum purchase amount should not be zero!"});
        }
        
        if(!discount || discount <= 0 || discount >= 4000){
            return res.render("addCoupon", {message: "You have reached minimum/maximum discount limit!"});
        }

        const newCoupon = new Coupon({
            name: name,
            description: description,
            code: code,
            validity: validity,
            minimumAmount: minimumAmount,
            discount: discount
        });

        await newCoupon.save();

        res.redirect("coupons");

    } catch (error) {
        console.log(error.message);
    }

}

// delete coupon
const deleteCoupon = async (req, res) => {

    try {
        
        const couponId = req.query.couponId;
        
        const couponData = await Coupon.findOne({_id: couponId});
        console.log('====================================================================================')
        console.log(couponData);
        console.log('====================================================================================')
        
        if (!couponData) {
            return res.json({ message: "No coupons found" });
        }

        await Coupon.deleteOne({_id: couponId});
        
        res.json({ message: "Coupon deleted successfully" });

    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    couponLoad,
    addCouponLoad,
    addCoupons,
    deleteCoupon
}