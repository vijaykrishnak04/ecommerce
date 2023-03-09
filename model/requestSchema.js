const mongoose = require('mongoose');
const Schema = mongoose.Schema

const requestSchema = new Schema({
    order: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'orders'
    },
    status: {
        type: String,
        default: "Pending",
    },
    message: {
        type: String,
        required: true
    }
})

const requests = mongoose.model('requests', requestSchema);

module.exports = requests