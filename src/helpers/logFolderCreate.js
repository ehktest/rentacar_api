"use strict";

const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

module.exports = {
  logFolderCreate: async () => {
    if (!fs.existsSync(path.join(__dirname, "..", "..", "logs"))) {
      await fsPromises.mkdir(path.join(__dirname, "..", "..", "logs"));
    }
  },
  fs,
  fsPromises,
  path,
};
