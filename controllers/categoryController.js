const categories = require("../model/categorySchema");

module.exports = {
  //category management

  getCategory: async (req, res) => {
    try {
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
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
  addCategory: async (req, res) => {
    try {
      if (req.body.name) {
        const name = req.body.name;
        const catgry = await categories.findOne({ category_name: name });
        if (catgry) {
          req.session.categoryExist = "category already exist";
          res.redirect("/admin/category");
        } else {
          const category = new categories({
            category_name: req.body.name,
            category_Image: req.file.filename
          });
          await category.save();
          res.redirect("/admin/category");
        }
      } else {
        res.redirect("/admin/category");
      }
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
  editCategory: async (req, res) => {
    try {
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
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
  deleteCategory: async (req, res) => {
    try {
      const id = req.params.id;
      await categories.updateOne({ _id: id }, { $set: { delete: true } });
      res.redirect("/admin/category");
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
  restoreCategory: async (req, res) => {
    try {
      const id = req.params.id;
      await categories.updateOne({ _id: id }, { $set: { delete: false } });
      res.redirect("/admin/category");
    } catch (error) {
      console.log(error);
      res.render("user/error");
    }
  },
}