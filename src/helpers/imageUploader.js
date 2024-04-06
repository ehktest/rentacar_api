"use strict";

module.exports = async (req, Model, update = undefined) => {
  if (req.files) {
    try {
      if (update) {
        const modelDoc = await Model.findOne(
          { _id: Object.values(req.params)[0] },
          { _id: 0, images: 1 }
        );

        for (let file of req.files) {
          // Mevcut modelDoc resimlerine ekle:
          // modelDoc.images.push(file.filename)
          modelDoc.images.push("/uploads/" + file.filename);
        }
        // modelDoc resimlerini req.body'ye aktar
        req.body.images = modelDoc.images;
      } else {
        const images = [];
        for (let file of req.files) {
          images.push("/uploads/" + file.filename);
        }
        // resimleri req.body'ye aktar
        req.body.images = images;
      }
    } catch (error) {
      return new Error(
        `An error occured on imageUploader: ${error.message || error}`
      );
    }
  }
};
