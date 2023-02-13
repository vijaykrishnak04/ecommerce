const otp = require("../model/otpSchema");
const mailer = require("../middlewares/otpValidation");
const bcrypt = require("bcrypt");

function mailSender(User) {
  return new Promise(async (resolve, reject) => {
    const OTP = `${Math.floor(1000 + Math.random() * 9000)}`;
    const botp = await bcrypt.hash(OTP, 10);
    console.log(OTP);

    const mailDetails = {
      from: "moonjiestore@gmail.com",
      to: User.email,
      subject: "Otp for Moonji E-com store",
      html: `<p>Your OTP for registering in Moonji E-store  is ${OTP}</p>`,
    };
    mailer.mailTransporter.sendMail(mailDetails, async function (err) {
      if (err) {
        console.log(err);
      } else {
        const userAlreadyExist = await otp.findOne({ email: User.email });
        if (userAlreadyExist) {
          otp.deleteOne({ email: User.email }).then(() => {
            otp
              .create({
                email: User.email,
                name: User.name,
                phone: User.phone,
                password: User.password,
                otp: botp,
              })
              .then(() => {
                resolve(true);
              });
          });
        } else {
          otp
            .create({
              email: User.email,
              name: User.name,
              phone: User.phone,
              password: User.password,
              otp: botp,
            })
            .then(() => {
              resolve(true);
            });
        }
      }
    });
  });
}

module.exports = mailSender;
