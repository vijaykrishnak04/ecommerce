const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carousalSchema = new Schema({
    offerType: {
        type: String,
        required: true
    },
    bannerText: {
        type: String,
        required: true
    },
    couponName: {
        type: String,
        required: true
    },
    bannerImage: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
    }
);

const carousal = mongoose.model('carousal', carousalSchema)
module.exports = carousal;