
const express = require('express');
const fs=require('fs')
const path=require('path')
var cors = require('cors')
const dotenv = require('dotenv');
dotenv.config();

const sequelize = require('./util/database');
const User = require('./models/users');
const Expense = require('./models/expenses');
const Order = require('./models/orders');
const Forgotpassword = require('./models/forgotpassword');
const DownloadedFiles = require('./models/downloadedFiles')


const userRoutes = require('./routes/user')
const expenseRoutes = require('./routes/expense')
const purchaseRoutes = require('./routes/purchase')
const premiumFeatureRoutes = require('./routes/premiumFeature')
const resetPasswordRoutes = require('./routes/resetpassword')


const app = express();
// const helmet=require('helmet')
// const morgan=require('morgan')

// const accessLogStream=fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'})


app.use(cors());

// app.use(bodyParser.urlencoded());  ////this is for handling forms
app.use(express.json());  //this is for handling jsons
// app.use(helmet({
//     contentSecurityPolicy: {
//         useDefaults: true,
//         directives: {
//             'script-src': ["'self'", 'https://cdnjs.cloudflare.com']
//         }
//     }
// }));
// app.use(morgan('combined',{stream:accessLogStream}))

app.use('/user', userRoutes)
app.use('/expense', expenseRoutes)
app.use('/purchase', purchaseRoutes)
app.use('/premium', premiumFeatureRoutes)
app.use('/password', resetPasswordRoutes);
app.use((req, res) => {
    console.log('url', req.url);
    console.log('Req is successfull');
    res.sendFile(path.join(__dirname, `public/${req.url}`));
})


User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(Forgotpassword);
Forgotpassword.belongsTo(User);

User.hasMany(DownloadedFiles);
DownloadedFiles.belongsTo(User);



sequelize.sync()
    .then(() => {
        console.log('server started',process.env.PORT)
        app.listen(process.env.PORT);
    })
    .catch(err => {
        console.log(err);
    })