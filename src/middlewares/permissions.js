"use strict";

const getUser = (req) => (req.userAPI ? req.userAPI : req.userBrowser);

module.exports = {
  isLogin: (req, res, next) => {
    if (process.env?.DB_HANDLE === "true") return next();
    const user = getUser(req);
    if (user?.isActive) {
      next();
    } else {
      res.errorStatusCode = 403;
      throw new Error("NoPermission: You must be logged in.");
    }
  },

  isStaff: (req, res, next) => {
    if (process.env?.DB_HANDLE === "true") return next();
    const user = getUser(req);
    if (user?.isActive && (user.isAdmin || user.isStaff)) {
      next();
    } else {
      res.errorStatusCode = 403;
      throw new Error("NoPermission: You must be logged in and Staff.");
    }
  },

  isAdmin: (req, res, next) => {
    if (process.env?.DB_HANDLE === "true") return next();
    const user = getUser(req);
    if (user?.isActive && user?.isAdmin) {
      next();
    } else {
      res.errorStatusCode = 403;
      throw new Error("NoPermission: You must be logged in and Admin.");
    }
  },
  getUser,
};
