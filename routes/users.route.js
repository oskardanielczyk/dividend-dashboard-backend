const express = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users.controller");

const router = express.Router();

router.get("/", usersControllers.getUsers);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").not().isEmpty(),
    check("password").not().isEmpty(),
  ],
  usersControllers.signUp
);

router.post(
  "/login",
  [check("email").not().isEmpty(), check("password").not().isEmpty()],
  usersControllers.login
);

module.exports = router;
