const express = require('express');

const userController = require('../controller/user');
const userauthentication = require('../middleware/auth')
const expenseController=require('../controller/expense')

const router = express.Router();


router.post('/signup', userController.signup);

router.post('/login', userController.login)

router.get('/download',userauthentication.authenticate,expenseController.downloadexpense)

module.exports = router;