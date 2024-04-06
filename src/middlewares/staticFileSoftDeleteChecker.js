"use strict";

const Car = require("../models/car");

module.exports = async (req, res, next) => {
  // Field bir array iceriyorsa $in operatörü, field'i belirtilen array'deki bir degerle eslesen en az bir oge iceren bir array'i iceren document'leri secer (ornegin, <value1> , <value2> , ve benzeri).
  const filePath = req.path; // Istekte bulunan dosya yolu -> req.path query'lerden arindirilmis url'dir
  const fileName = filePath.split("/").pop(); // Dosya adini al -> / ile bolup en son kisim alindiginda dosya adi alinmis olacaktir

  // Dosya adinin images dizisi icerisinde olup olmadigini kontrol et
  const car = await Car.findOne({
    images: { $in: ["/uploads/" + fileName] },
    destroyTime: null,
  });

  if (car) {
    next(); // Eger car soft delete edilmemis ve dosya adi images dizisi icindeyse, statik dosya sunumuna izin ver
  } else {
    res
      .status(404)
      .send(
        `${fileName} not found on the server or not related with a valid document at the moment.`
      ); // Eger soft delete edilmisse veya dosya adi images dizisi icinde degilse, 404 hatasi dondur
  }
};
