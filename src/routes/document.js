"use strict";

const router = require("express").Router();
const path = require("path");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const redoc = require("redoc-express");
const { projectName } = require("../helpers/projectNameGenerator");
// * swagger cdn css for vercel deploy
const SWAGGER_CSS_CDN_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.6.2/swagger-ui.min.css";
/* ------------------------------------------------------- */
// routes/document:

// URL: /documents

// ? SWAGGER JSON
// ! express static relative dosya yollarini cwd(current working directory)'e gore belirler, yani root'a gore. kafa karisikligi olacaksa absolute path de kullanilabilir.
router.use("/json", express.static("./src/configs/swagger.json"));

// ? REDOC:
router.use("/redoc", redoc({ specUrl: "/documents/json", title: projectName }));

// Swagger:
// ? SWAGGER
// * swagger cdn css for vercel deploy
router.use(
  "/swagger",
  swaggerUi.serve,
  // swaggerUi.setup(require(path.join(__dirname, "..", "..", "swagger.json")), {
  swaggerUi.setup(require("../configs/swagger.json"), {
    persistAuthorization: true,
    customCss:
      ".swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }",
    customCssUrl: SWAGGER_CSS_CDN_URL,
  })
);

router.all("/", (req, res) => {
  // * dynamic hostname for different deploys
  const scheme = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  const basePath = `${scheme}://${host}`;
  res.json({
    swagger: `${basePath}/documents/swagger`,
    redoc: `${basePath}/documents/redoc`,
    json: `${basePath}/documents/json`,
  });
});

/* ------------------------------------------------------- */
module.exports = router;
