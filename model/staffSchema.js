const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: Number,
        trim: true,
        required: true,
    },
    department: {
        type: String,
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
})

const staff = mongoose.model('staff', staffSchema)
module.exports = staff;