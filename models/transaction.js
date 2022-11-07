const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  creator: { type: mongoose.Types.ObjectId, require: true, ref: "User" },
  date: { type: String, require: true },
  name: { type: String, require: true },
  ticker: { type: String, require: true },
  price: { type: Number, require: true },
  numberOfStocks: { type: Number, require: true },
});

module.exports = mongoose.model("Transaction", transactionSchema);
