"use strict";

const multer = require("multer");
const { fs, path } = require("../helpers/logFolderCreate");
const uploadLogFileCreate = require("../helpers/uploadLogFileCreate");

// ? UPLOAD
// https://www.npmjs.com/package/multer
// https://expressjs.com/en/resources/middleware/multer.html
// * multer package'i ile multipart/form-data verileri parse edilebilir.
// * Genel bir middleware degildir, dosya yukleme islemi nerede yapilacaksa orada cagirilmasi gereken bir middleware'dir.
// ! WARNING: Make sure that you always handle the files that a user uploads. Never add multer as a global middleware since a malicious user could upload files to a route that you didn’t anticipate. Only use this function on routes where you are handling the uploaded files.

// Once uploads dizini ve dosya adlarini gecici olarak tutacak txt dosyasi yoksa olusturuluyor
const uploadDir = path.join(__dirname, "..", "..", "uploads");
const uploadPathsLogFile = path.join(uploadDir, "upload_temp_log.txt");
(async () => {
  await uploadLogFileCreate(uploadDir, uploadPathsLogFile);
})();

module.exports = {
  upload: multer({
    // dest : './uploads'
    storage: multer.diskStorage({
      destination: "./uploads",
      filename: async (req, file, returnCallback) => {
        // returnCallback(error, fileName)
        // returnCallback(null, 'desiredFileName')

        // temp logging
        const datePrefix = Date.now();
        const fileName =
          file.originalname === "default_car_image.png"
            ? "default_car_image.png"
            : datePrefix + "_" + file.originalname;
        const fullPath = path.join("uploads", fileName);

        await fs.appendFile(uploadPathsLogFile, `${fullPath}\n`, (err) => {
          if (err) returnCallback(err); // Hata olusursa islemi kes
          returnCallback(null, fileName);
        });
      },
      limits: {
        fileSize: 1024 * 1024 * 4, // 4 MB icin
      }, // kabul edilen en buyuk dosya boyutu, byte cinsinden
      fileFilter: (req, file, returnCallback) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
          returnCallback(null, true);
        } else {
          //rejects storing a file
          returnCallback(null, false);
        }
      },
    }),
  }),
  uploadDir,
  uploadPathsLogFile,
};
