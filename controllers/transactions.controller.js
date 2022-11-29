const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const axios = require("axios");

const HttpError = require("../models/http-error");
const Transaction = require("../models/transaction");
const User = require("../models/user");

const getTransactionById = async (req, res, next) => {
  const transactionId = req.params.tid;

  let filteredTransaction;
  try {
    filteredTransaction = await Transaction.findById(transactionId);
  } catch (error) {
    return next(
      new HttpError("Could not find transaction for provided id", 500)
    );
  }

  res.json({ transaction: filteredTransaction.toObject({ getters: true }) });
};

const getTransactionsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let filteredTransaction;
  try {
    filteredTransaction = await Transaction.find({ creator: userId });
  } catch (error) {
    return next(
      new HttpError("Could not find transactions for provided user id", 500)
    );
  }

  const map = new Map(filteredTransaction.map((i) => [i.ticker, i.exchange]));
  const array = Array.from(map, ([name, value]) => name + "." + value);

  // https://eodhistoricaldata.com/api/real-time/AAPL.US?api_token=demo&fmt=json&s=VTI,EUR.FOREX
  // 63846ed0c02bb2.60812969

  try {
    const response = await axios.get(
      `https://eodhistoricaldata.com/api/real-time/AAPL.US?api_token=${
        process.env.API_TOKEN
      }fmt=json&s=${array.join(",")}`,
      {
        headers: {
          "accept-encoding": "null",
        },
      }
    );
    if (response.data.constructor === Array) {
      filteredTransaction.map((el) => {
        response.data.map((res) => {
          if (el.ticker + "." + el.exchange === res.code) {
            el.closePrice = res.close;
            el.dayChange = res.change_p;
            return;
          }
        });
      });
    } else {
      filteredTransaction.map((el) => {
        if (el.ticker + "." + el.exchange === response.data.code) {
          el.closePrice = response.data.close;
          el.dayChange = response.data.change_p;
          return;
        }
      });
    }
  } catch (error) {
    console.log(error);
  }

  res.status(200).json({
    transactions: filteredTransaction.map((transaction) =>
      transaction.toObject({ getters: true })
    ),
  });
};

const createTransaction = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }

  const { creator, date, name, ticker, exchange, price, numberOfStocks } =
    req.body;
  const createdTransaction = new Transaction({
    creator,
    date,
    name,
    ticker,
    exchange,
    price,
    numberOfStocks,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    return next(new HttpError("Creating transaction failed", 500));
  }

  if (!user) {
    return next(new HttpError("Cannot find user for provided user id", 500));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdTransaction.save({ session: sess });
    user.transactions.push(createdTransaction);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    console.log(error);
    return next(new HttpError("Could not add new transaction.", 500));
  }

  res.status(201).json({ transaction: createdTransaction });
};

const updateTransaction = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }

  const { numberOfStocks } = req.body;
  const transactionId = req.params.tid;

  let transaction;
  try {
    transaction = await Transaction.findById(transactionId);
  } catch (error) {
    return next(new HttpError("Could not update transaction.", 500));
  }

  if (transaction.creator.toString() !== req.userData.userId) {
    return next(
      new HttpError("You are not allowed to edit this transaction", 500)
    );
  }

  transaction.numberOfStocks = numberOfStocks;

  try {
    await transaction.save();
  } catch (error) {
    return next(new HttpError("Could not update transaction.", 500));
  }

  res
    .status(200)
    .json({ transaction: transaction.toObject({ getters: true }) });
};

const deleteTransaction = async (req, res, next) => {
  const transactionId = req.params.tid;

  let transaction;
  try {
    transaction = await Transaction.findById(transactionId).populate("creator");
  } catch (error) {
    return next(new HttpError("Could not delete transaction.", 500));
  }

  if (!transaction) {
    return next(new HttpError("Transaction don't exists.", 500));
  }

  if (transaction.creator.id !== req.userData.userId) {
    return next(
      new HttpError("You are not allowed to delete this transaction", 500)
    );
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await transaction.remove({ session: sess });
    transaction.creator.transactions.pull(transaction);
    await transaction.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(new HttpError("Could not delete transaction.", 500));
  }

  res.status(200).json({ message: "Transaction deleted" });
};

exports.getTransactionById = getTransactionById;
exports.getTransactionsByUserId = getTransactionsByUserId;
exports.createTransaction = createTransaction;
exports.updateTransaction = updateTransaction;
exports.deleteTransaction = deleteTransaction;
