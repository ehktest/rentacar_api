"use strict";

// Car Controller:

const Car = require("../models/car");
const Reservation = require("../models/reservation");
const dateValidator = require("../helpers/dateValidator");
const utcDateGenerator = require("../helpers/utcDateGenerator");
const imageUploader = require("../helpers/imageUploader");
const imageDeleter = require("../helpers/imageDeleter");
const truncateErrorUploads = require("../helpers/truncateErrorUploads");
const { fs } = require("../helpers/logFolderCreate");
const { uploadPathsLogFile } = require("../middlewares/upload");
const { getUser } = require("../middlewares/permissions");

module.exports = {
  list: async (req, res) => {
    /*
      #swagger.tags = ["Cars"]
      #swagger.summary = "List Cars <Permissions: Public>"
      #swagger.description = `
        You can send query with endpoint for filter[], search[], sort[], page and limit.
        <ul> Examples:
          <li>URL/?<b>filter[field1]=value1&filter[field2]=value2</b></li>
          <li>URL/?<b>search[field1]=value1&search[field2]=value2</b></li>
          <li>URL/?<b>sort[field1]=1&sort[field2]=-1</b></li>
          <li>URL/?<b>page=2&limit=1</b></li>
        </ul>
      `
    */

    // http://127.0.0.1:8000/cars?startDate=2024-03-15&endDate=2024-04-05
    // query ile startDate endDate key'lerinde utc date verisi gonderilip bu tarihlerde musait olmayan(daha once rezerve edilmis olan) araclar result set'in disinda tutulur

    const { startDate: getStartDate, endDate: getEndDate } = req.query;

    // isAvailable false olanlari listeleme
    const filter = { isAvailable: true, destroyTime: null };
    if (getStartDate && getEndDate) {
      // Her iki tarih icin de gecerlilik kontrolu yap
      if (!dateValidator(getStartDate) || !dateValidator(getEndDate)) {
        throw new Error(
          "startDate and endDate must be valid UTC date strings."
        );
      }

      // Her iki tarih de su anki zamandan daha gec olmali
      if (
        new Date(getStartDate) <= new Date() ||
        new Date(getEndDate) <= new Date()
      ) {
        throw new Error(
          "startDate and endDate must be later than current time."
        );
      }

      // endDate startDate'ten daha gec olmali
      if (new Date(getEndDate) <= new Date(getStartDate)) {
        throw new Error("endDate must be later than startDate.");
      }

      // Cakisma olusturan rezervasyonlari bul
      const reservations = await Reservation.find(
        {
          $and: [
            { startDate: { $lt: new Date(getEndDate) } },
            { endDate: { $gt: new Date(getStartDate) } },
          ],
        },
        { _id: 0, carId: 1 }
      ).distinct("carId");

      // console.log(
      //   "🔭 ~ list: ~ reservations without distinct ➡ ➡ ",
      //   reservations
      // );
      // localhost:8000/cars?startDate=2024-04-09&endDate=2024-04-10
      // 🔭 ~ list: ~ reservations ➡ ➡  [
      //   { carId: new ObjectId("660b1ff6bf7f8c0d1730e39b") },
      //   { carId: new ObjectId("660b2012bf7f8c0d1730e39f") }
      // ]
      console.log("🔭 ~ list: ~ reservations with distinct ➡ ➡ ", reservations);
      // 🔭 ~ list: ~ reservations with distinct ➡ ➡  [
      //   new ObjectId("660b1ff6bf7f8c0d1730e39b"),
      //   new ObjectId("660b2012bf7f8c0d1730e39f")
      // ]

      // Cakisma olusturan rezervasyonlara ait araclarin ID'lerini array olarak cikar -> distinct kullanildiginda key'leri kaldirip array'de toplar bu nedenle map ile key'leri kaldirarak array'de toplama islemine gerek kalmaz.
      // const reservedCarIds = reservations.map(
      //   (reservation) => reservation.carId
      // );
      // console.log("🔭 ~ list: ~ reservedCarIds ➡ ➡ ", reservedCarIds);
      // 🔭 ~ list: ~ reservedCarIds ➡ ➡  [
      //   new ObjectId("660b1ff6bf7f8c0d1730e39b"),
      //   new ObjectId("660b2012bf7f8c0d1730e39f")
      // ]

      // Cakisma olusturan rezervasyonalara ait araclarin id listesi bos degilse, bunları filtrele
      // before distinct
      // if (reservedCarIds.length > 0) {
      //   filter._id = { $nin: reservedCarIds }; // $nin kullanarak array halindeki ID'ler dislanir
      // }
      // after distinct
      if (reservations.length > 0) {
        filter._id = { $nin: reservations }; // $nin kullanarak array halindeki ID'ler dislanir
      }
    } else {
      throw new Error("startDate and endDate queries are required.");
    }

    const data = await res.getModelList(Car, filter, [
      { path: "createdId", select: "username" },
      { path: "updatedId", select: "username" },
    ]);

    res.status(200).send({
      error: false,
      details: await res.getModelListDetails(Car, filter),
      result: data,
    });
  },

  create: async (req, res, next) => {
    /*
      #swagger.tags = ["Cars"]
      #swagger.summary = "Create Car <Permissions: Staff>"
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
          plateNumber: '34ABC123',
          brand: "Ford",
          model: "Mustang",
          year: 1967,
          isAutomatic: false,
          pricePerDay: 200,
          isAvailable: false,
          images: ["/uploads/default_car_image.png"],
          createdId: "660b113091cd968f2b061318",
          updatedId: "660b113091cd968f2b061318"
        }
      }
    */
    //  $ref: '#/definitions/Car'
    try {
      const user = getUser(req);

      // destroyTime create ve update'te daima override edilir
      req.body.destroyTime = null;

      // createdId ve updatedId verilerini user'dan al
      req.body.createdId = user._id;
      req.body.updatedId = user._id;

      // if files uploaded, add them to the body
      const newImages = await imageUploader(req, Car);
      if (newImages instanceof Error) {
        return next(newImages);
      }

      const data = await Car.create(req.body);
      res.status(201).json({
        error: false,
        result: data,
      });
      // Log dosyasını temizle
      fs.truncateSync(uploadPathsLogFile); // Log dosyasını senkron olarak temizle
    } catch (error) {
      // Hata olustugunda yuklenmis dosyalari sil ve loglari temizle
      truncateErrorUploads();

      if (error.code === 11000) {
        return res.status(400).json({
          error: true,
          message: "Plate number already exists.",
        });
      }

      res.status(500).json({
        error: true,
        message: error.message || "An error occurred while updating the car.",
      });
    }
  },

  read: async (req, res) => {
    /*
      #swagger.tags = ["Cars"]
      #swagger.summary = "Get Single Car <Permissions: Public>"
    */

    const data = await Car.findOne({
      _id: req.params.carId,
      destroyTime: null,
    }).populate([
      { path: "createdId", select: "username" },
      { path: "updatedId", select: "username" },
    ]);

    res.status(200).send({
      error: false,
      result: data,
    });
  },

  update: async (req, res, next) => {
    /*
      #swagger.tags = ["Cars"]
      #swagger.summary = "Update Car <Permissions: Staff>"
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
          plateNumber: '34CBA987',
          brand: "Ford",
          model: "Mustang",
          year: 1969,
          isAutomatic: false,
          pricePerDay: 220,
          isAvailable: true,
          images: ["/uploads/default_car_image.png"],
          createdId: "660b113091cd968f2b061318",
          updatedId: "660b113091cd968f2b061318"
        }
      }
    */
    //  $ref: '#/definitions/Car'
    try {
      const user = getUser(req);

      // destroyTime create ve update'te daima override edilir
      req.body.destroyTime = null;

      // updatedId verisini user'dan al
      req.body.updatedId = user._id;

      // if files uploaded, delete old ones first
      const delImages = await imageDeleter(req, Car, true);
      if (delImages instanceof Error) {
        return next(delImages);
      }

      // if files uploaded, add them to the body
      const upImages = await imageUploader(req, Car, true);
      if (upImages instanceof Error) {
        return next(upImages);
      }

      const data = await Car.findByIdAndUpdate(req.params.carId, req.body, {
        runValidators: true,
        new: true,
      }); // default olarak bulunani doner, update edilmis halini degil. new:true ile update edilmis halini doner.

      // 202 -> accecpted
      res.status(202).json({
        error: false,
        message: "Updated",
        body: req.body, // gonderilen veriyi goster
        // result: await Car.findById(req.params.carId), // guncellenmis veriyi goster
        result: data, // guncellenmis veriyi goster
      });
      // Log dosyasını temizle
      fs.truncateSync(uploadPathsLogFile); // Log dosyasını senkron olarak temizle
    } catch (error) {
      // Hata olustugunda yuklenmis dosyalari sil ve loglari temizle
      truncateErrorUploads();

      if (error.code === 11000) {
        return res.status(400).json({
          error: true,
          message: "Plate number already exists.",
        });
      }

      res.status(500).json({
        error: true,
        message: error.message || "An error occurred while updating the car.",
      });
    }
  },

  destroy: async (req, res, next) => {
    /*
      #swagger.tags = ["Cars"]
      #swagger.summary = "Delete Car <Permissions: Admin>"
    */

    // Soft delete:
    const car = await Car.findById(req.params.carId);
    if (car) {
      const localeDate = new Date();

      car.destroyTime = localeDate;

      const deletedCar = await car.save();

      res.status(204).send({
        error: false,
        deletedCar,
      });
    } else {
      res.status(404).send({
        error: true,
        message: "Car not found",
      });
    }
  },
};
