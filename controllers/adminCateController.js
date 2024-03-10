const User = require("../models/userdbModel");
const Category = require("../models/categorydbModel");

// load page and add category
const addCategoryLoad = async (req, res) => {

    try {
        
        const cateData = await Category.find({});
        res.render("addCategory", {cateData});

    } catch (error) {
        console.log(error.message);
    }

}

// verify category
const verifyCategory = async (req, res) => {
    try {
                
        const cateName = req.body.cateName;
        const cateDescription = req.body.cateDescription;
        const is_listed = req.body.is_listed;
        
        const category = new Category({
            cateName: cateName,
            cateDescription: cateDescription,
            is_listed: is_listed
        });

        await category.save();  
        res.redirect("/admin/addCategory");

    } catch (error) {
        console.log(error.message);
    }
}

// edit category load
const editCategory = async (req, res) => {
    try {
       
        const id = req.query.id;
        console.log(id);
        const cateData = await Category.findById({_id: id});

        if(cateData)
            res.render("editCategory", {categories: cateData});
        else
            res.redirect("/admin/addCategory");

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    addCategoryLoad,
    verifyCategory,
    editCategory
}