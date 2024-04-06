"use strict";

const { mongoose } = require("../configs/dbConnection");
const { Schema, models, model } = mongoose;
const passwordEncrypt = require("../helpers/passwordEncrypt");
const emailFieldValidator = require("../helpers/emailFieldValidator");
const {
  dateFieldTimeOffset,
  timeStampsOffset,
} = require("../helpers/modelDateTimeOffset");
/* ------------------------------------------------------- *
{
    "username": "test",
    "password": "1234",
    "email": "test@site.com",
    "firstName": "john",
    "lastName": "doe",
    "isActive": true,
    "isStaff": false,
    "isAdmin": false
}
/* ------------------------------------------------------- */
// User Model:

const UserSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      trim: true,
      required: true,
      // ! setter validate'ten once calistigi icin setter'da validasyon yapilip gecerse dilenen manipulasyon yapilip gecmezse belirli bir deger dondurulur ve validate ile yalnizca bu degerin dondurulup dondurulmedigi kontrol edilir. Boylece hem setter ve validate kullanilmis olur
      set: function (password) {
        const passwordRegex =
          /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,16}/;
        if (!passwordRegex.test(password)) {
          return "wrong";
        } else {
          return passwordEncrypt(password);
        }
      },
      validate: [
        (password) => password !== "wrong",
        "Password must contain at least 1 uppercase & lowercase letter, 1 digit, 1 special character and must be between 8 and 16 characters in total.",
      ],
      // selected:false
    },

    email: {
      type: String,
      trim: true,
      required: [true, "Email field must be required"],
      unique: [true, "There is this email. Email field must be unique"],
      validate: [emailFieldValidator],
    },

    firstName: String,
    lastName: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    isStaff: {
      type: Boolean,
      default: false,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },
    destroyTime: {
      type: Date,
      default: null,
      set: dateFieldTimeOffset,
    },
  },
  {
    collection: "user",
    timestamps: { currentTime: timeStampsOffset },
  }
);

/* ------------------------------------------------------- */
module.exports = models?.User || model("User", UserSchema);
