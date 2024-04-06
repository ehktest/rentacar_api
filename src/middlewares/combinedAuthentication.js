"use strict";

const tokenAuthentication = require("./tokenAuthentication");
const cookieAuthentication = require("./cookieAuthentication");

module.exports = async (req, res, next) => {
  // * token oncelikli authentication kombinasyonu. token auth'da(classic token | jwt) hata alinirsa ve client bir yandan cookie de geri gonderiyorsa, cookie backend'e ulasmadan error response donulecek
  const tokenAuthResult = await tokenAuthentication(req, res);
  if (tokenAuthResult instanceof Error) {
    req.isUserAuthenticated = false;
    return next(tokenAuthResult);
  }
  const cookieAuthResult = await cookieAuthentication(req, res);
  if (cookieAuthResult instanceof Error) {
    req.isUserAuthenticated = false;
    return next(cookieAuthResult);
  }
  if (!(tokenAuthResult || cookieAuthResult)) {
    req.isUserAuthenticated = false;
  } else {
    req.isUserAuthenticated = true;
  }
  next();
};
