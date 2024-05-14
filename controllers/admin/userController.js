const User = require("../../models/userdbModel");

//customer List Load
const customerListLoad = async (req, res) => {

    try {
        const userData = await User.find({});
        res.render("customerList", { userData });

    } catch (error) {
        res.render("404error");
    }

}

// blocking user
const blockUser = async (req, res) => {
    try {

        const userId = req.params.userId;

        await User.findByIdAndUpdate(userId, { is_blocked: true });
        res.redirect("/admin/customerList");

    } catch (error) {
        res.render("404error");
    }
}

//unblocking user
const unblockUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        await User.findByIdAndUpdate(userId, { is_blocked: false });
        res.redirect("/admin/customerList");

    } catch (error) {
        res.render("404error");
    }
}

module.exports = {

    customerListLoad,
    blockUser,
    unblockUser,

}