"use strict";

const { logEvents } = require("./fsLogging");
const { format } = require("date-fns");

const formatErrorStack = (err) => err.stack.split("\n").slice(0, 2).join("\n");

module.exports = (err, req, res, next) => {
  // checking response whether custom error status code is set
  const errorStatusCode = res?.errorStatusCode ?? err?.statusCode ?? 500;

  // print error on server console
  console.error(`Error : ${(err?.stack ?? err?.cause ?? err?.message) || err}`);
  // deactivate loggers for vercel deploy if activated:
  if (process.env.NODE_ENV !== "production") {
    // genellikle bir web uygulamasına yapılan HTTP isteklerinde, tarayıcılar çapraz kaynak istekleri (CORS istekleri) sırasında otomatik olarak "Origin" başlığını ekler. same-origin icin eklenmeyeceginden localhost belirlenebilir.
    const origin = req.headers.origin ?? "localhost";
    const now = new Date();
    const today = format(new Date(), "yyyy-MM-dd");
    // logging errors on local
    logEvents(
      `ERROR -> ${formatErrorStack(err)}\t| METHOD -> ${
        req.method
      }\t| ORIGIN -> ${origin}\t| URL ->${req.url}\t| `,
      `ERRORS_${today}.txt`,
      { continuous: true }
    );
    res.on("finish", () => {
      logEvents(
        `USER_EMAIL -> ${req.userEmail}\t| USER_TOKEN -> ${req.headers.authorization}`,
        `ERRORS_${today}.txt`,
        { prefix: false }
      );
    });
  }

  return res
    .status(errorStatusCode) // 500 Internal Server Error
    .send({
      error: true,
      message: err.message,
      cause: err.cause,
      body: req.body,
      // Detaylı hata bilgisi sadece geliştirme ortamında döndürülür
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
      }),
    });
};
