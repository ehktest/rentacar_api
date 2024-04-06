"use strict";

const reservation = require("../controllers/reservation");
const router = require("express").Router();
const { isLogin, isStaff, isAdmin } = require("../middlewares/permissions");
const idValidation = require("../middlewares/idValidation");
/* ------------------------------------------------------- */
// routes/reservation:

// URL: /reservations

router
  .route("/:reservationId")
  .all(idValidation)
  // ? get single
  .get(isLogin, reservation.read)
  // ? update
  .put(isStaff, reservation.update)
  .patch(isStaff, reservation.update)
  // ? delete
  .delete(isAdmin, reservation.destroy);

router
  .route("/")
  // ? get all
  .get(isLogin, reservation.list)
  // ? create
  .post(isLogin, reservation.create);

/* ------------------------------------------------------- */
module.exports = router;
