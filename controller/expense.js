
const Expense = require('../models/expenses');
const User=require('../models/users')
const AWS=require('aws-sdk')
const Report  = require('../models/downloadedFiles');


function uploadToS3(data,fileName){
    const BUCKET_NAME=process.env.BUCKET_NAME
    const IAM_USER_KEY=process.env.IAM_USER_KEY
    const IAM_USER_SECRET=process.env.IAM_USER_SECRET

    let s3bucket= new AWS.S3({
        accessKeyId:IAM_USER_KEY,
        secretAccessKey:IAM_USER_SECRET
    })
    var params={
        Bucket:BUCKET_NAME,
        Key:fileName,
        Body:data,
        ACL:'public-read'
    }
    return new Promise((resolve,reject)=>{
        s3bucket.upload(params,(err,s3response)=>{
            if(err){
                console.log(err)
                reject(err)
            }
            else{
                console.log("success",s3response);
                 resolve(s3response.Location)
            }
        })
    })
}

const downloadexpense=async (req,res)=>{
    try {
        const expenses = await req.user.populate({
            path: 'expenses',
            select: 'expense description category updatedAt -_id'
        });
      
        console.log(expenses)
        const stringifiedExpenses = JSON.stringify(expenses.expenses);
    
        const userId=req.user._id
        const fileName=`Expenses${userId}/${new Date()}.txt`
        const fileUrl=await uploadToS3(stringifiedExpenses,fileName)
        const report = await Report.create({ url: fileUrl, userId: req.user._id });
        await req.user.updateOne({$push: {expenseReport:report._id}});
        res.status(200).json({ fileUrl });
        
    } catch (err) {
        console.log(err)
        res.status(500).json({fileUrl:'',success:false,err:err})
    }
}
const addexpense =async (req, res) => {
    try {
        const { expense, description, category } = req.body;
        const _id = req.user._id;
        if(expense == undefined || expense.length === 0 ){
            return res.status(400).json({success: false, message: 'Parameters missing'})
        }
       const result=await Expense.create({ expense, description, category})
       await User.updateOne(
        { _id: _id },
        {
          $inc: {
            totalExpense: expense,
          },
          $push: {
            expenses: result._id,
          },
        }
      );
              res.status(200).json({expense:result})
        } catch (error) {
                console.log(error);
                return res.status(500).json({success : false, error: error})
         }
    }
const getexpenses =async (req, res)=> {
    const { pageSize=5  ,page=1 } = req.query ;  
    const limit=parseInt(pageSize);
    const offset= (page - 1) * parseInt(pageSize)
    try {
        const p1 = await req.user.populate("expenses");
        const totalExpenses = p1.expenses;
        const expenses = await Expense.find({ _id: { $in: totalExpenses } })
          .skip(offset)
          .limit(limit);
        const totalPages = Math.ceil(totalExpenses.length / parseInt(pageSize));
           return res.status(200).json({
            expenses,
            currentPage: parseInt(page),
            totalPages: totalPages
        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: err, success: false})
    }
    
}

const deleteexpense = async (req, res) => {
    try {
        const _id = req.params._id;
        const userId = req.user._id;
        const expense = await Expense.findOne({ _id: _id });       
        if (!expense) {
            return res.status(400).json({ success: false, message: "Expense not found" });
        }
        const expenseAmount = expense.expense;
        await User.updateOne(
            { _id: userId },
            {
              $inc: {
                totalExpense: -expenseAmount  ,
              },
              $pull: {
                expenses: _id,
              },
            }
          );
          await expense.deleteOne();
        res.status(200).json({ success: true});
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Failed" });
    }
}

module.exports = {
    deleteexpense,
    getexpenses,
    addexpense,
    downloadexpense
}
