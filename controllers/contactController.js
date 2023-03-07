

module.exports = {
    getContact : (req,res)=>{
        try{
            res.render('user/contact')
        } catch(err){
            next(err)
        }
    }
}