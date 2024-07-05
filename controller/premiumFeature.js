const User = require('../models/users');
const Expense = require('../models/expenses');
const sequelize = require('../util/database');
const e = require('express');

const getUserLeaderBoard = async (req, res) => {
    try{
        const leaderboard = await User.find({ totalExpense: { $gt: 0 } }, 'name totalExpense')
        .sort({ totalExpense: -1 })
        .limit(10);
        res.status(200).json(leaderboard);
} catch (err){
    console.log(err)
    res.status(500).json(err)
}
}

module.exports = {
    getUserLeaderBoard
}