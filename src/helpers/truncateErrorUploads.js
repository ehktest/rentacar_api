"use strict";

const { fs } = require("./logFolderCreate");
const { uploadPathsLogFile } = require("../middlewares/upload");

module.exports = () => {
  const fileData = fs.readFileSync(uploadPathsLogFile, "utf8");
  const filePaths = fileData.trim().split("\n");
  // log file bossa bos string olarak([""]) ceker, bos string ise unlink yapmasi onlenmeli
  // console.log("🔭 ~ filePaths ➡ ➡ ", filePaths);
  // 🔭 ~ filePaths ➡ ➡  [ '' ]
  filePaths.forEach((filePath) => {
    if (filePath) fs.unlinkSync(filePath); // Dosyayı senkron olarak sil
  });

  // Log dosyasını temizle
  fs.truncateSync(uploadPathsLogFile); // Log dosyasını senkron olarak temizle
};
