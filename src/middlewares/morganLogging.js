"use strict";

// log kaydi icin morgan package'i kullanilabilir, express docs'ta 3rd party middlewares'te yer alir.
// https://expressjs.com/en/resources/middleware/morgan.html
// yarn add morgan

// morgan logger
const morgan = require("morgan");
const moment = require("moment-timezone");

// morgan log'larini local file'a kaydetmek icin node fs modulu
const fs = require("node:fs");
const { logFolderCreate } = require("../helpers/logFolderCreate");
const { getUser } = require("../middlewares/permissions");

// morgan logger with format string and write to local file day by day
const now = new Date();
const today = now.toISOString().split("T")[0];

// log folder'i yoksa olustur.
logFolderCreate();

// morgan'a custom token'lar eklenerek string format'ta kullaniliyor
morgan.token("user", (req, res) => req?.userEmail);
morgan.token("user-roles", (req, res) => {
  const user = getUser(req);
  return JSON.stringify({
    isActive: user?.isActive,
    isStaff: user?.isStaff,
    isAdmin: user?.isAdmin,
  });
});
morgan.token("user-token", (req, res) => req.headers.authorization);

// morgan'da locale date-time kullan
morgan.token("localdate", (req, res, tz) => {
  return moment().tz(tz).format("DD/MMM/YYYY:HH:mm:ss ZZ");
});

module.exports = morgan(
  "IP=:remote-addr | USER_EMAIL=:user | USER_ROLES=:user-roles | USER_TOKEN=:user-token | TIME=:localdate[Europe/Istanbul] | METHOD=:method | URL=:url | STATUS=:status | LENGTH=:res[content-length] | REF=:referrer |  AGENT=:user-agent",
  {
    stream: fs.createWriteStream(`./logs/MORGAN_${today}.log`, { flags: "a+" }),
  }
);
