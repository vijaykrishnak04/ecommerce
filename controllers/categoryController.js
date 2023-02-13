const categories = require("../model/categorySchema");

module.exports = {
    //category management

  getCategory: async (req, res) => {
    const category = await categories.find();
    const categoryExist = req.session.categoryExist;
    req.session.categoryExist = "";
    const editCategoryExist = req.session.editCategoryExist;
    req.session.editCategoryExist = "";
    res.render("admin/category", {
      category,
      categoryExist,
      editCategoryExist,
    });
  },
  addCategory: async (req, res) => {
    if (req.body.name) {
      const name = req.body.name;
      const catgry = await categories.findOne({ category_name: name });
      if (catgry) {
        req.session.categoryExist = "category already exist";
        res.redirect("/admin/category");
      } else {
        const category = new categories({
          category_name: req.body.name,
        });
        await category.save();
        res.redirect("/admin/category");
      }
    } else {
      res.redirect("/admin/category");
    }
  },
  editCategory: async (req, res) => {
    if (req.body.name) {
      const name = req.body.name;
      const id = req.params.id;
      const category = await categories.findOne({ category_name: name });
      if (category) {
        req.session.editCategoryExist = "Category already exist";
        res.redirect("/admin/category");
      } else {
        await categories.updateOne(
          { _id: id },
          {
            $set: {
              category_name: req.body.name,
            },
          }
        );
        res.redirect("/admin/category");
      }
    } else {
      res.redirect("/admin/category");
    }
  },
  deleteCategory: async (req, res) => {
    const id = req.params.id;
    await categories.updateOne({ _id: id }, { $set: { delete: true } });
    res.redirect("/admin/category");
  },
  restoreCategory: async (req, res) => {
    const id = req.params.id;
    await categories.updateOne({ _id: id }, { $set: { delete: false } });
    res.redirect("/admin/category");
  },
}