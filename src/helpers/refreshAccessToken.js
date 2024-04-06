"use strict";

const User = require("../models/user");
const jwt = require("jsonwebtoken");

module.exports = async function (refreshToken) {
  // jwt.verify(token, secretOrPublicKey, [options, callback])
  // https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
  const refreshData = await jwt.verify(refreshToken, process.env.REFRESH_KEY);

  // ? refresh token gecerliyse ve refresh token'daki id password bilgileri de gecerliyse yeni access token uret
  if (refreshData) {
    const user = await User.findById(refreshData.id);
    // jwt.sign JSON object'i bekler
    if (user && user.password == refreshData.password) {
      // access token ile mumkun oldugunca az miktarda hassas veri gondermeye ozen gosterilmelidir
      // return jwt.sign(user.toJSON(), process.env.ACCESS_KEY, {
      const accessTokenPayload = {
        _id: user._id,
        id: user.id,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
      };
      return jwt.sign(accessTokenPayload, process.env.ACCESS_KEY, {
        expiresIn: process.env?.ACCESS_EXP || "30m",
      });
    } else {
      throw new Error("Wrong password for specified user.");
    }
  } else {
    throw new Error("JWT refresh data is not valid");
  }
};
