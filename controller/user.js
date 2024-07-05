const User = require('../models/users');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Report = require('../models/downloadedFiles');


function isstringinvalid(string){
    if(string == undefined ||string.length === 0){
        return true
    } else {
        return false
    }
}

 const signup = async (req, res)=>{
    try{
    const { name, email, password } = req.body;
    if(isstringinvalid(name) || isstringinvalid(email) || isstringinvalid(password)){
        return res.status(400).json({err: "Bad parameters . Something is missing"})
    }
    const saltrounds = 10;
    bcrypt.hash(password, saltrounds, async (err, hash) => {
        console.log(err)
        await User.create({ name, email, password: hash })
        res.status(201).json({message: 'Successfuly create new user'})
    })
    }catch(err) {
            res.status(500).json(err);
        }

}

function generateAccessToken(_id, name,isPremiumUser) {
    return jwt.sign({ _id: _id, name: name,isPremiumUser }, 'secretkey');
  }
  
const login = async (req, res) => {
    try{
    const { email, password } = req.body;
    if(isstringinvalid(email) || isstringinvalid(password)){
        return res.status(400).json({message: 'Email id or password is missing ', success: false})
    }
    console.log(password);
    const user = await User.findOne({email: email});
        if(user){
           bcrypt.compare(password, user.password, (err, result) => {
           if(err){
            throw new Error('Something went wrong')
           }
            if(result === true){
                return res.status(200).json({success: true, message: "User logged in successfully",token: generateAccessToken(user._id, user.name, user.isPremiumUser)})
            }
            else{
            return res.status(400).json({success: false, message: 'Password is incorrect'})
           }
        })
        } else {
            return res.status(404).json({success: false, message: 'User Does not exitst'})
        }
    }catch(err){
        res.status(500).json({message: err, success: false})
    }
}

const downloadRecords = async (req,res ) => {
    try{
        const isPremiumUser = req.user.isPremiumUser;
        const _id = req.user._id;
        if(isPremiumUser){
            const expenseReportIds  = req.user.expenseReport
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0,20); 
            const p = await Report.find({ _id: { $in: expenseReportIds } })
            .sort({ updatedAt: -1 })
            .limit(20);

        // Log each entry in p
        p.forEach((result, index) => {
            console.log(`Entry ${index}:`, result);
        });


                res.status(201).json(p)
        }else{
            res.status(401).json({ success: false, message: "Unauthorized : you are not a premium user" });
        }
    }catch(err) {
        console.error('Error fetching:', err);
        res.status(500).json({ error: 'Failed to fetch' ,err:err});
    };

}
module.exports = {
    signup,
    login,
    generateAccessToken,
    downloadRecords

}