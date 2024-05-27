
const Expense = require('../models/expenses');
const User=require('../models/users')
const sequelize=require('../util/database')
const AWS=require('aws-sdk')
const DownloadedFiles = require('../models/downloadedFiles');


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
        const expenses=await req.user.getExpenses();
        console.log(expenses)
        const stringifiedExpenses= JSON.stringify(expenses)
    
        const userId=req.user.id
        const fileName=`Expenses${userId}/${new Date()}.txt`
        const fileUrl=await uploadToS3(stringifiedExpenses,fileName)
        await DownloadedFiles.create({url:fileUrl , userId:req.user.id})
        console.log(fileUrl)
        res.status(200).json({fileUrl:fileUrl,success:true})
    
    } catch (err) {
        console.log(err)
        res.status(500).json({fileUrl:'',success:false,err:err})
    }
}
const addexpense =async (req, res) => {
    const t=await sequelize.transaction()
    try {
        const { expenseamount, description, category } = req.body;

        if(expenseamount == undefined || expenseamount.length === 0 ){
            return res.status(400).json({success: false, message: 'Parameters missing'})
        }
       const expense=await Expense.create({ expenseamount, description, category, userId: req.user.id},{transaction:t})
            const totalExpense=Number(req.user.totalExpenses)+Number(expenseamount)
             await User.update({
                totalExpenses:totalExpense
            },{
                where:{id:req.user.id},
                transaction:t
            })
            await t.commit()
            res.status(200).json({expense:expense})
        } catch (error) {
                await t.rollback()
                return res.status(500).json({success : false, error: error})
         }
    }
const getexpenses =async (req, res)=> {
    const { pageSize=5  ,page=1 } = req.query ;  
    try {
        const expenses = await Expense.findAll({
            where: { userId: req.user.id },
            limit:parseInt(pageSize),
            offset: (page - 1) * parseInt(pageSize)
        });
        const totalItems = await Expense.count({ 
            where : { userId:req.user.id }
        })
        console.log('Total Items:', totalItems);
        console.log('Page Size:', pageSize);
        console.log('Page:', page);
        const totalPages = Math.ceil(totalItems / parseInt(pageSize));
        console.log('Total Pages:', totalPages);
           return res.status(200).json({
            expenses,
            currentPage: parseInt(page),
            totalItems,
            totalPages: totalPages
        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: err, success: false})
    }
    
}

const deleteexpense = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const expenseid = req.params.expenseid;
        const expense = await Expense.findOne({ where: { id: expenseid, userId: req.user.id } });
        
        if (!expense) {
            return res.status(400).json({ success: false, message: "Expense not found" });
        }
        
        const deleted = await Expense.destroy({ where: { id: expenseid, userId: req.user.id }, transaction: t });
        const totalExpense = Number(req.user.totalExpenses) - Number(expense.expenseamount);
        await User.update({
            totalExpenses: totalExpense
        },{
            where: { id: req.user.id },
            transaction: t
        });
        
        await t.commit();
        res.status(200).json({ success: true, expense: deleted });
    } catch (error) {
        await t.rollback();
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
