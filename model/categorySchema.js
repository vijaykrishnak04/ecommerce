const mongoose = require('mongoose');
const Schema = mongoose.Schema
const categorySchema = new Schema({
    category_name: {
        type: String,
        uppercase: true,
        required: true
    },
    category_Image: {
        type: String,
        default:false,
    },
    delete: {
        type: Boolean,
        default: false,
    }
})
module.exports = mongoose.model('categories', categorySchema);
