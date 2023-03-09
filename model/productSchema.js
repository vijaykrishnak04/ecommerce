const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'categories'
    },
    description: {
        type: String,
        required: true
    },
    image: [{
        path: String
    }
    ],
    stock: {
        type: Number,
        required: true
    },
    delete: {
        type: Boolean,
        default: false
    }
},
    { timestamps: true }
)


const products = mongoose.model('products', productSchema)

module.exports = products

