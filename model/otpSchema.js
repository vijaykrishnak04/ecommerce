const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
});

const otp = mongoose.model("otp", otpSchema);
module.exports = otp;
