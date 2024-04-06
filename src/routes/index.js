"use strict";

const router = require("express").Router();
const { projectName } = require("../helpers/projectNameGenerator");
/* ------------------------------------------------------- */
// ROUTER INDEX:

// URL: /

// auth routes:
router.use("/auth", require("./auth"));

// user routes:
router.use("/users", require("./user"));

// token routes:
router.use("/tokens", require("./token"));

// car routes:
router.use("/cars", require("./car"));

// reservation routes:
router.use("/reservations", require("./reservation"));

// document routes:
router.use("/documents", require("./document"));

// Check functionality of combinedAuthentication middleware on root
router.all("/", (req, res) => {
  // * dynamic host for different deploys
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  const basePath = `${proto}://${host}`;
  res.json({
    error: false,
    message: `WELCOME TO ${projectName} PROJECT`,
    // ? Cookie Authentication
    cookies: req.session?.id ? "recieved" : undefined,
    authCookieData: req?.userBrowser ? req.userBrowser : undefined,
    // ? Token Authentication
    authAPIData: req?.userAPI ? req.userAPI : undefined,
    isLogin: req?.isUserAuthenticated ? req.isUserAuthenticated : false,
    api: {
      documents: {
        swagger: `${basePath}/documents/swagger`,
        redoc: `${basePath}/documents/redoc`,
        json: `${basePath}/documents/json`,
      },
    },
  });
});

/* ------------------------------------------------------- */
module.exports = router;
