const User = require("../../models/userdbModel");
const bcrypt = require("bcrypt");

//-----------------------------------------------admin-login-and-verification----------------------------------------------//
// admin login
const adminLoad = async (req, res) => {

    try {

        res.render('adminLogin');

    } catch (error) {
        console.log(error.message);
    }
}

// verify admin login
const verifyAdminLogin = async (req, res) => {

    try {

        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {

            const passMatch = await bcrypt.compare(password, userData.password);
            if (passMatch) {

                if (userData.is_admin === 0) {

                    res.render('adminLogin', { message: "You are not admin..!" })

                } else {

                    req.session.admin_id = userData._id;

                    res.redirect('/admin/adminHome');
                }

            } else {

                res.render('adminLogin', { message: "email and password incorrect" });
            }
        } else {

            res.render('adminLogin', { message: "email and password incorrect" });
        }

    } catch (error) {
        console.log(error.message);
    }

}

// load admin home
const homeLoad = async (req, res) => {

    try {

        res.render('adminHome');

    } catch (error) {
        console.log(error.message);
    }
}

//---------------------------------------------end-admin-login-and-verification--------------------------------------------//
//---------------------------------------------------------customers-------------------------------------------------------//


//------------------------------------------------------end-customers------------------------------------------------------//
const adminLogout = async (req, res) => {

    try {

        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {

    adminLoad,
    verifyAdminLogin,
    homeLoad,
    adminLogout

}