const mongoose = require('mongoose')
mongoose.set('strictQuery', true);

module.exports = {
    dbconnect:()=>{
         mongoose.connect(process.env.MONGODB_URL,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
         })
        .then(()=>{
            console.log("database connected successfully")
         })
         .catch((err)=>console.log("error"+err));
    }
};