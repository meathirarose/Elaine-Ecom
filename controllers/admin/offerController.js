const Offer = require("../../models/offerdbModel");

// offer load
const offerLoad = async (req, res) => {

    try {
        
        const offerData = await Offer.find({});

        res.render("offers", {offerData: offerData});

    } catch (error) {
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

        if(!name || /^\s*$/.test(name)){
            return res.render("addOffer", {message: "Enter a valid offer name"});
        }

        if(!description || /^\s*$/.test(description) || description.trim().length < 5){
            return res.render("addOffer", {message: "Enter a valid offer description"});
        }

        if(!offerPercentage || offerPercentage > 100 || offerPercentage < 0){
            return res.render("addOffer", {message: "Enter a valid offer percentage"});
        }

        if(!validity || validity < currentDate){
            return res.render("addOffer", {message: "Enter a valid date"});
        }

        if(!type || /^\s*$/.test(type)){
            return res.render("addOffer", {message: "Please select an offer type"});
        }

        if(!typeName || /^\s*$/.test(typeName)){
            return res.render("addOffer", {message: "Please select an offer type name"});
        }

        const newOffer = new Offer({
            name: name,
            description: description,
            offerPercentage: offerPercentage,
            validity: validity,
            status: true,
            type: type,
            typeName: typeName
        })

        await newOffer.save();

        res.redirect("offers");

    } catch (error) {
        console.log(error.message);
    }

}

// delete offer
const deleteOffer = async (req, res) => {

    try {
        
        const offerId = req.query.offerId;
        
        const offerData = await Offer.findOne({_id: offerId});
        console.log('====================================================================================')
        console.log(offerData);
        console.log('====================================================================================')
        
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
    addOfferLoad,
    addOffer,
    deleteOffer
}