const mongoose = require('mongoose');
const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId

const orderSchema = new Schema(
    {
        userId: {
            type: ObjectId,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        phone: {
            type: Number,
            required: true
        },
        houseName: {
            type: String,
            required: true
        },
        area: {
            type: String,
            required: true
        },
        landMark: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        postOffice: {
            type: String,
            required: true
        },
        pin: {
            type: Number,
            required: true
        },
        orderItems: [
            {
                productId: {
                    type: ObjectId,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
            }
        ],
        totalAmount: {
            type: Number,
            required: true
        },
        orderStatus: {
            type: String,
            default: "Pending"
        },
        paymentMethod:
        {
            type: String,
            required: true
        },
        paymentStatus: {
            type: String,
            default: "Not paid"
        },
        orderDate: {
            type: String,
        },
        deliveryDate: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

const orders = mongoose.model("orders", orderSchema)
module.exports = orders;