"use strict";

require("dotenv").config();
require("express-async-errors");
const path = require("node:path");
const express = require("express");
const app = express();
const cors = require("cors");
const session = require("cookie-session");
const { logger } = require("./src/middlewares/fsLogging");
const { connectDB } = require("./src/configs/dbConnection");
const syncModels = require("./src/helpers/sync");
const staticFileSoftDeleteChecker = require("./src/middlewares/staticFileSoftDeleteChecker");

let HOST, PORT;
if (process.env.NODE_ENV !== "production") {
  HOST = process.env?.HOST || "127.0.0.1";
  PORT = process.env?.PORT || 8000;
} else {
  HOST = "cloud.mongodb.com";
  PORT = 8000;
}
/* ------------------------------------------------------------------ */

// ? cors
app.use(cors({ origin: "*", credentials: true }));

// * deactivate loggers for vercel deploy if activated:
// ? nodejs local logger -> request logs handled via morgan
if (process.env.NODE_ENV !== "production") {
  app.use(logger);
}

// * deactivate loggers for vercel deploy if activated:
// ? morgan local logger
if (process.env.NODE_ENV !== "production") {
  app.use(require("./src/middlewares/morganLogging"));
}

// DATA RECEIVING -> body parsers(eskiden expressjs'te ilave body parser package'i ile bu islem yapiliyordu ama artik body verileri bu sekilde direkt express instance uzerinden cekilebilmektedir)
// https://expressjs.com/en/resources/middleware/body-parser.html
// ( npm install body-parser / var bodyParser = require('body-parser') / app.use(bodyParser.json())) / var jsonParser = bodyParser.json() app.post('/api/users', jsonParser, function (req, res) {…} )

// Accept JSON and convert to object
app.use(express.json());
// Accept text
app.use(express.text());
// Accept form
app.use(express.urlencoded({ extended: true }));

// (browser)http://localhost:8000/public/images/monalisa.jpg -> Cannot GET /public/images/monalisa.jpg
// ? Allow static files
// app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/static", express.static("./public"));
// path /static/* iken ./public/* ile eslestirilir.
// http://localhost:8000/static/images/monalisa.jpg -> gorsel painted
app.use("/uploads", staticFileSoftDeleteChecker, express.static("./uploads"));

// IIFE
(async () => {
  // Veritabanı bağlantısını test et
  await connectDB();

  // sync models(model degisikliklerinin database'de manuel olarak handle edilmesi)
  await syncModels();

  // ? Cookies(Session Cookies - Persistent Cookies)
  app.use(
    session({
      secret: process.env.SECRET_KEY, // Sifreleme anahtari
      // maxAge: 1000 * 60 * 60 * 24 * 3 // milliseconds // 3 days
      // Burasi global cookie ayarlaridir, maxAge burada tanimlanirsa session olarak calismaz ve degiskenlik gostermez. controller'larda ayri ayri yapmak daha fazla esneklik saglar.
      // httpOnly: a boolean indicating whether the cookie is only to be sent over HTTP(S), and not made available to client JavaScript (true by default).
      httpOnly: true,
      // secure: a boolean indicating whether the cookie is only to be sent over HTTPS (false by default for HTTP, true by default for HTTPS). If this is set to true and Node.js is not directly over a TLS connection, be sure to read how to setup Express behind proxies or the cookie may not ever set correctly.
      secure: process.env.NODE_ENV === "production",
      // sameSite: a boolean or string indicating whether the cookie is a "same site" cookie (false by default). This can be set to 'strict', 'lax', 'none', or true (which maps to 'strict').
      sameSite: "none",
    })
  );

  // ? Authentication(Cookies) - deprecated for jwt authentication
  // app.use(require("./src/middlewares/cookieAuthentication"));

  // ? Authentication(JWT Token) - deprecated for combined authentication
  // app.use(require("./src/middlewares/tokenAuthentication"));

  // ? Authentication(Cookie - ClassicToken - JWT Combined)
  app.use(require("./src/middlewares/combinedAuthentication"));

  // Filter, Search, Sort, Pagination middleware
  app.use(require("./src/middlewares/queryHandler"));

  // ? Routes
  app.use("/", require("./src/routes"));
  // index.js dosyalari path'te belirtilmese de otomatik olarak calisir.

  // not found catcher
  app.all("*", (req, res) => {
    res.status(404).send(`${req.method} ${req.path} not found`);
  });

  // error handler middleware via imported controller
  app.use(require("./src/middlewares/errorHandler"));

  // request listener
  app.listen(
    PORT,
    process.env.NODE_ENV !== "production" ? HOST : undefined,
    () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    }
  );
})();
