const User = require("../../models/userdbModel");

//customer List Load
const customerListLoad = async (req, res) => {

    try {
        const userData = await User.find({});
        res.render("customerList", { userData });

    } catch (error) {
        console.log(error.message);
    }

}

// blocking user
const blockUser = async (req, res) => {
    try {

        const userId = req.params.userId;

        await User.findByIdAndUpdate(userId, { is_blocked: true });
        res.redirect("/admin/customerList");

    } catch (error) {
        console.log(error.message);
    }
}

//unblocking user
const unblockUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        await User.findByIdAndUpdate(userId, { is_blocked: false });
        res.redirect("/admin/customerList");

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {

    customerListLoad,
    blockUser,
    unblockUser,

}