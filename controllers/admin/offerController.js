const Offer = require("../../models/offerdbModel");
const Product = require("../../models/productdbModel");
const Category = require("../../models/categorydbModel");

// offer load
const offerLoad = async (req, res) => {

    try {
        
        const offerData = await Offer.find({});

        res.render("offers", {offerData: offerData});

    } catch (error) {
        console.log(error.message);
    }

}

// change the status of offer
const changeOfferStatus = async (req, res) =>{
    try {
        
        const {offerId, newStatus} = req.params;

        let status;
        if (newStatus === 'activate') {
            status = true;
        } else if('deactivate'){
            status = false;
        }
        await Offer.findByIdAndUpdate({_id: offerId}, {status: status});

        res.json({success: true});

    } catch (error) {
        console.log(error.message);
    }
}

// add offer load
const addOfferLoad = async (req, res) => {

    try {
        
        res.render("addOffer");

    } catch (error) {
        console.log(error.message);
    }

}

// to get products
const getProducts = async (req, res) => {
    try {

        const productData = await Product.find({ is_listed: true });
        const products = productData.map(product => product.prdctName);
        res.json({ products });

    } catch (error) {
        console.log(error.message);
    }
}

// to get categories
const getCategories = async (req, res) => {
    try {

        const categoryData = await Category.find({ is_listed: true });
        const categories = categoryData.map(category => category.cateName);
        res.json({ categories });

    } catch (error) {
        console.log(error.message);
    }
}


// add offer
const addOffer = async (req, res) => {
    try {
        const name = req.body.offerName;
        const description = req.body.offerDescription;
        const offerPercentage = req.body.offerPercentage;
        const validity = new Date(req.body.offerValidity);
        const currentDate = new Date();
        const type = req.body.offerType;
        const typeName = req.body.offerTypeName;

        if (!name || /^\s*$/.test(name)) {
            return res.json({ error: "Enter a valid offer name" });
        }

        if (!description || /^\s*$/.test(description) || description.trim().length < 5) {
            return res.json({ error: "Enter a valid offer description" });
        }

        if (!offerPercentage || offerPercentage > 100 || offerPercentage <= 0) {
            return res.json({ error: "Enter a valid offer percentage" });
        }

        if (!validity || validity < currentDate) {
            return res.json({ error: "Enter a valid date" });
        }

        if (!type || /^\s*$/.test(type)) {
            return res.json({ error: "Please select an offer type" });
        }

        if (!typeName || /^\s*$/.test(typeName)) {
            return res.json({ error: "Please select an offer typeName" });
        }

        const newOffer = new Offer({
            name: name,
            description: description,
            offerPercentage: offerPercentage,
            validity: validity,
            status: true,
            type: type,
            typeName: typeName
        });

          await newOffer.save();

        return res.json({message: " success"})

    } catch (error) {
        console.log(error.message);
        res.json({ error: "An error occurred while adding the offer" });
    }
}

// delete offer
const deleteOffer = async (req, res) => {

    try {
        
        const offerId = req.query.offerId;
        
        const offerData = await Offer.findOne({_id: offerId});
        
        if (!offerData) {
            return res.json({ message: "No offers found" });
        }

        await Offer.deleteOne({_id: offerId});
        
        res.json({ message: "Offer deleted successfully" });

    } catch (error) {
        console.log(error.message);
    }

}


module.exports = {
    offerLoad,
    changeOfferStatus,
    addOfferLoad,
    getProducts,
    getCategories,
    addOffer,
    deleteOffer
}