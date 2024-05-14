const Category = require("../../models/categorydbModel");


// load add category
const categoryLoad = async (req, res) => {
    try {

        const cateData = await Category.find({});
        res.render("addCategory", { cateData });

    } catch (error) {
        res.render("404error");
    }
}

// list category
const listCategory = async (req, res) => {

    try {

        const cateId = req.params.cateId;

        await Category.findByIdAndUpdate(cateId, { is_listed: true });
        res.redirect("/admin/addCategory");

    } catch (error) {
        res.render("404error");
    }

}

//unlisting category
const unlistCategory = async (req, res) => {
    try {
        const cateId = req.params.cateId;

        await Category.findByIdAndUpdate(cateId, { is_listed: false });
        res.redirect("/admin/addCategory");

    } catch (error) {
        res.render("404error");
    }
}

// add category
const addCategory = async (req, res) => {

    try {
        const cateName = req.body.cateName.trim();
        const cateDescription = req.body.cateDescription;
        const is_listed = req.body.is_listed;
        const lowerCase = cateName.toLowerCase();

        // checking valid category name
        if (!cateName || /^\s*$/.test(cateName)) {
            const cateData = await Category.find({});
            return res.render("addCategory", { cateData, message: "Enter a valid name" });
        }
        const regex = new RegExp("^" + lowerCase + "$", "i");
        const existingCategory = await Category.findOne({ cateName: regex });

        if (existingCategory) {
            const cateData = await Category.find({});
            return res.render("addCategory", { cateData, message: "Category already exist.!" });
        }

        // checking valid category description
        if (!cateDescription || /^\s*$/.test(cateDescription)) {
            const cateData = await Category.find({});
            return res.render("addCategory", { cateData, message: "Enter a valid category" });
        }

        const category = new Category({
            cateName: cateName,
            cateDescription: cateDescription,
            is_listed: is_listed
        });

        const cateData = await category.save();

        if (cateData) {
            const cateData = await Category.find({});
            res.render("addCategory", { cateData, message: "Category added successfully" });
        }

    } catch (error) {
        res.render("404error");
    }

}

// edit category load
const editCategory = async (req, res) => {
    try {

        const id = req.query.id;
        const cateData = await Category.findById({ _id: id });

        if (cateData) {
            res.render("editCategory", { cateData });
        }
        else {
            res.redirect("/admin/addCategory");
        }

    } catch (error) {
        res.render("404error");
    }
}

// update category
const updateCategory = async (req, res) => {
    try {

        const cateId = req.body.cateId;
        const cateData = await Category.findOne({ _id: cateId });

        const cateName = req.body.cateName.trim();
        const cateDescription = req.body.cateDescription.trim();
        const lowerCase = cateName.toLowerCase();

        // checking valid category name
        if (!cateName || /^\s*$/.test(cateName)) {
            return res.render("editCategory", { cateData, message: "Enter a valid name" });
        }

        const regex = new RegExp("^" + lowerCase + "$", "i");
        const existingCategory = await Category.findOne({ cateName: regex });

        if (existingCategory && existingCategory._id.toString() !== cateId) {
            return res.render("editCategory", { cateData, message: "Category already exist.!" });
        }

        // checking valid category description
        if (!cateDescription || /^\s*$/.test(cateDescription)) {
            const cateData = await Category.find({});
            return res.render("editCategory", { cateData, message: "Enter a valid category" });
        }

        await Category.findByIdAndUpdate({ _id: cateId }, { $set: { cateName: req.body.cateName, cateDescription: req.body.cateDescription } })
        res.redirect("/admin/addCategory");

    } catch (error) {
        res.render("404error");
    }

}

module.exports = {

    categoryLoad,
    listCategory,
    unlistCategory,
    addCategory,
    editCategory,
    updateCategory,
    
}