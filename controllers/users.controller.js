const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (error) {
    return next(new HttpError("Fetching users failed, please try again", 500));
  }

  res
    .status(201)
    .json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("Signing up failed, please try again", 500));
  }

  if (existingUser) {
    return next(new HttpError("User already exists", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(new HttpError("Signing up failed, please try again", 500));
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: "dummyurl",
    transactions: [],
  });

  try {
    await createdUser.save();
  } catch (error) {
    return next(new HttpError("Signing up failed, please try again.", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, userEmail: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(new HttpError("Signing up failed, please try again.", 500));
  }

  res.status(201).json({
    userId: createdUser.id,
    userEmail: createdUser.email,
    token: token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("Login failed, please try again", 500));
  }

  if (!existingUser) {
    return next(new HttpError("User don't exists. Please first sign up", 500));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    return next(new HttpError("Login failed, please try again", 500));
  }

  if (!isValidPassword) {
    return next(new HttpError("Wrong password for provided user email", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, userEmail: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(new HttpError("Loging in failed, please try again.", 500));
  }

  res.status(200).json({
    userId: existingUser.id,
    userEmail: existingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;
