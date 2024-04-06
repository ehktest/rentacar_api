"use strict";
const { fs, path } = require("../helpers/logFolderCreate");
const rootDir = path.join(__dirname, "..", "..");

module.exports = async (req, Model, update = undefined) => {
  if (!update || (update && req.files)) {
    try {
      const modelDoc = await Model.findById(Object.values(req.params)[0]);
      const images = modelDoc.images;
      images.forEach((image) => {
        fs.unlinkSync(path.join(rootDir, image));
      });
      // silme durumunda req.params [] olacagindan Object.values(req.params)[0] undefined doner ve bir guncelleme islemi gerceklesmez ama zaten document komple silinecegi icin bir sorun da teskil etmez
      await Model.findByIdAndUpdate(
        Object.values(req.params)[0],
        { images: [] },
        { runValidators: true }
      );
    } catch (error) {
      return new Error(
        `An error occured on imageDeleter: ${error.message || error}`
      );
    }
  }
};
