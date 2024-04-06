"use strict";

const car = require("../controllers/car");
const router = require("express").Router();
const { isStaff, isAdmin } = require("../middlewares/permissions");
const idValidation = require("../middlewares/idValidation");
const { upload } = require("../middlewares/upload");
/* ------------------------------------------------------- */
// routes/car:

// URL: /cars

// ! swagger route regex'lerle saglikli calismamaktadir. orn: (\\w+). idValidation middleware'i varsa kullanilmayabilir.
router
  .route("/:carId")
  .all(idValidation)
  // ? get single
  .get(car.read) // AllowAny
  // ? update
  .put(isStaff, upload.array("images", 5), car.update)
  .patch(isStaff, upload.array("images", 5), car.update)
  // ? delete
  .delete(isAdmin, car.destroy);

router
  .route("/")
  // ? get all
  .get(car.list) // AllowAny
  // ? create
  .post(isStaff, upload.array("images", 5), car.create);

/* ------------------------------------------------------- */
module.exports = router;
