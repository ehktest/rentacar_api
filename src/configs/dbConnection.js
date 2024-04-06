"use strict";

// yarn add mongoose
const mongoose = require("mongoose");

const DBNAME_CONSTANT = process.env?.DATABASE_NAME;
let CLUSTER, DATABASE;
if (process.env.NODE_ENV !== "production") {
  CLUSTER = process.env?.DATABASE_URI_LOCAL;
  DATABASE = process.env?.DATABASE_NAME || DBNAME_CONSTANT;
} else {
  CLUSTER = process.env?.DATABASE_URI_REMOTE;
  DATABASE = "";
}

// database name, cluster'da mevcut olmasa bile collection'larda oldugu gibi otomatik olusturur.
// mongoose
//   .connect(`${CLUSTER}/${DATABASE}`)
//   .then(() => console.log("*** DB Connected ***"))
//   .catch(() => console.log("*** DB Connection Error ***", err));

const connectDB = async () => {
  try {
    const DBNAME_STRING = " " + (DATABASE || DBNAME_CONSTANT);
    await mongoose.connect(`${CLUSTER}${DATABASE}`);
    console.log(`*** DB${DBNAME_STRING} Connected ***`);
  } catch (err) {
    console.log(`*** DB${DBNAME_STRING} Connection Error ***`);
    console.error(err);
  }
};

module.exports = { mongoose, connectDB };
