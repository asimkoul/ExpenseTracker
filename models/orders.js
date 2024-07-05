const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//id, name , password, phone number, role

const orderSchema = new Schema({
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  });
  
  module.exports = mongoose.model("Order", orderSchema);
