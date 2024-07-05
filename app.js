const express = require('express');
const fs=require('fs')
const path=require('path')
var cors = require('cors')
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require("mongoose");

const userRoutes = require('./routes/user')
const expenseRoutes = require('./routes/expense')
const purchaseRoutes = require('./routes/purchase')
const premiumFeatureRoutes = require('./routes/premiumFeature')
const resetPasswordRoutes = require('./routes/resetpassword')

const app = express();

app.use(cors());
app.use(express.json());  //this is for handling jsons

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
mongoose.connect(process.env.MONGO_URL,  { useNewUrlParser: true })
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log("Server running on port 3000");
        })
    })
    .catch(err => console.log(err))
