const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
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
    phone: {
        type: Number,
        trim: true,
        required: true,
    },
    walletTotal: {
        type: Number,
        default: 0
    },
    walletDetails: [

    ],
    cancelledDate: {
        type: String,
    },

    addressDetails: [
        {
            phone: {
                type: Number,
            },
            housename: {
                type: String,
            },
            area: {
                type: String,
            },
            landMark: {
                type: String,
            },
            district: {
                type: String,
            },
            postoffice: {
                type: String,
            },
            state: {
                type: String,
            },
            pin: {
                type: String,
            }
        }
    ],
    password: {
        type: String,
        required: true,
        trim: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
})

const users = mongoose.model('users', userSchema)
module.exports = users;