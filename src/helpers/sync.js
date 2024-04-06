"use strict";

const User = require("../models/user");
const Car = require("../models/car");
const Reservation = require("../models/reservation");

module.exports = async function (bool) {
  if (!bool) {
    return null;
  } else {
    // /* Exampla Data - Run Once */
    /* REMOVE DATABASE */
    // const { mongoose } = require("../configs/dbConnection");
    // await mongoose.connection.dropDatabase();
    // console.log("- Database and all data DELETED!");
    /* REMOVE DATABASE */

    /* ADD ADMIN USER */
    // await User.create({
    //   username: "admin",
    //   email: "admin@site.com",
    //   password: "Qwer1234!",
    //   firstName: "admin",
    //   lastName: "admin",
    //   isActive: true,
    //   isStaff: false,
    //   isAdmin: true,
    // });
    // console.log("- Admin user created.");
    /* ADD ADMIN USER */

    // MOCK USERS */
    // for (let i in [...Array(200)]) {
    //   await User.create({
    //     username: "mock" + String(i),
    //     password: "Qwer1234!",
    //     email: "mock" + String(i) + "@site.com",
    //     firstName: "mock" + String(i),
    //     lastName: "mock" + String(i),
    //     isActive: !!(Math.random() < 0.5),
    //     isAdmin: false,
    //     isLead: false,
    //   });
    // }
    // MOCK USERS */

    // SOFT DELETE -> ADD DESTROY TIME TO ALL EXISTING DOCUMENTS */
    // await User.updateMany({}, { destroyTime: null });
    // await Car.updateMany({}, { destroyTime: null });
    // await Reservation.updateMany({}, { destroyTime: null });
    // SOFT DELETE -> ADD DESTROY TIME TO ALL EXISTING DOCUMENTS */

    // End:
    console.log("** Synchronized **");
  }
};
