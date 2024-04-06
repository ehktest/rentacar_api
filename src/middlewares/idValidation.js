"use strict";

const mongoose = require("mongoose");
const CustomError = require("../errors/customError");

module.exports = (req, res, next) => {
  const isValid = mongoose.isValidObjectId(Object.values(req.params)[0]);
  if (!isValid) throw new CustomError("ID is not valid", 400); // 400 Bad Request
  next();
};
