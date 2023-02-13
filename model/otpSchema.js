const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const otpSchema = new Schema({
    otp:{
        type:String,
        required:true
    },
    email:{
        type:String
    },
    name:{
        type:String
    },
    phone:{
        type:String
    },
    password:{
        type:String
    },
    expiration : {
        type: Date,
        
    }
}); 

const otp = mongoose.model('otp',otpSchema)
module.exports = otp;
 