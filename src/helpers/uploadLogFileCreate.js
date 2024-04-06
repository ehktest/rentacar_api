"use strict";

const { fs, fsPromises } = require("./logFolderCreate");

module.exports = async (uploadDir, uploadPathsLogFile) => {
  // Önce dizini kontrol et ve yoksa olustur
  if (!fs.existsSync(uploadDir)) {
    await fsPromises.mkdir(uploadDir, { recursive: true });
  }

  // Sonra dosyayi kontrol et ve yoksa olustur
  try {
    if (!fs.existsSync(uploadPathsLogFile)) {
      await fsPromises.writeFile(uploadPathsLogFile, ""); // Bos bir icerikle dosya olustur
    }
  } catch (error) {
    console.error("File couldnt be created:", error);
  }
};
