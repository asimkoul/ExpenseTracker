const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//id, name , password, phone number, role

// const Expense = sequelize.define('expenses', {
//     id: {
//         type: Sequelize.INTEGER,
//         autoIncrement: true,
//         allowNull: false,
//         primaryKey: true
//     },
//     expense: Sequelize.INTEGER,
//     category: Sequelize.STRING,
//     description: Sequelize.STRING,
// })

// module.exports = Expense;

const expenseSchema = new Schema({
    expense: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  module.exports = mongoose.model("Expense", expenseSchema);