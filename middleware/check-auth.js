const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  let token;
  try {
    token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new HttpError("Authorization failed!", 500);
    }
    const decodedToken = jwt.verify(token, "SECRET_VALUE_FOR_TOKEN");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    return next(new HttpError("Authorization failed!", 500));
  }
};
