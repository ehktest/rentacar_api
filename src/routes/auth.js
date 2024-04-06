"use strict";

const auth = require("../controllers/auth");
const router = require("express").Router();
/* ------------------------------------------------------- */
// routes/auth:

// URL: /auth

router
  .post("/login", auth.login)
  .get("/refresh_browsers", auth.refresh_browsers) // refresh token cookie ile iletiliyor
  .get("/refresh_others", auth.refresh_others) // refresh token json response ile iletiliyor
  .get("/logout", auth.logout);
// ! swagger all method'unu desteklemez

/* ------------------------------------------------------- */
module.exports = router;
