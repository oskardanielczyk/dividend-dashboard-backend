const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
var cron = require("node-cron");

const transactionRoutes = require("./routes/transactions.route");
const userRoutes = require("./routes/users.route");
const HttpError = require("./models/http-error");

// cron.schedule("* * * * *", () => {
//   console.log("running a task every minute");
// });

const app = express();

app.use(bodyParser.json());

app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/stocks", transactionRoutes);

app.use("/api/users", userRoutes);

app.use((req, res, next) => {
  return next(new HttpError("Could't find this route", 404));
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured" });
});

mongoose
  .connect(
    // `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@db-dividash-20299.nodechef.com/${process.env.DB_NAME}?retryWrites=true&w=majority`
    `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@db-dividash-20299.nodechef.com:5386/${process.env.DB_NAME}`
  )
  .then(() => {
    app.listen(process.env.PORT || 2000);
  })
  .catch((err) => console.log(err));
