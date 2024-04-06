"use strict";

const Token = require("../models/token");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  try {
    const auth = req.headers?.authorization || null; // Token ...tokenKey...
    const tokenKey = auth ? auth.split(" ") : null; // ['Token', '...tokenKey...']

    let verified = false;
    if (tokenKey) {
      if (tokenKey[0] == "Token") {
        // Token ...tokenKey...
        // ClassicToken:

        const tokenData = await Token.findOne({ token: tokenKey[1] }).populate(
          "userId"
        );

        if (tokenData) {
          const userAPIData = {
            _id: tokenData.userId._id,
            id: tokenData.userId._id,
            isActive: tokenData.userId.isActive,
            isAdmin: tokenData.userId.isAdmin,
            isStaff: tokenData.userId.isStaff,
          };
          req.userAPI = userAPIData;
          req.userEmail = tokenData.userId.email; // for logging
          verified = true;
        } else {
          req.userAPI = undefined;
          req.userEmail = undefined; // for logging
        }
      }
      if (tokenKey[0] == "Bearer") {
        // Bearer ...accessToken...
        // JWT:

        verified = jwt.verify(
          tokenKey[1],
          process.env.ACCESS_KEY,
          async (error, decodedAccessData) => {
            if (decodedAccessData) {
              const user = await User.findById(decodedAccessData._id);
              req.userAPI = decodedAccessData;
              req.userEmail = user.email; // for logging
              return true;
            } else {
              req.userAPI = undefined;
              req.userEmail = undefined; // for logging
              return false;
            }
          }
        );
      }
    }

    return verified;
  } catch (error) {
    return error;
  }
};
