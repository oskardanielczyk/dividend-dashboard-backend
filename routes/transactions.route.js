const express = require("express");
const { check } = require("express-validator");

const transactionsControllers = require("../controllers/transactions.controller");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.use(checkAuth);

router.get("/user/:uid", transactionsControllers.getTransactionsByUserId);

router.get("/:tid", transactionsControllers.getTransactionById);

router.post(
  "/",
  [
    check("date").not().isEmpty(),
    check("name").not().isEmpty(),
    check("numberOfStocks").not().isEmpty(),
  ],
  transactionsControllers.createTransaction
);

router.patch(
  "/:tid",
  check("numberOfStocks").isInt({ min: 1 }),
  transactionsControllers.updateTransaction
);

router.delete("/:tid", transactionsControllers.deleteTransaction);

module.exports = router;
