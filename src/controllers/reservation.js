"use strict";

// Reservation Controller:

const Reservation = require("../models/reservation");
const Car = require("../models/car");
const utcDateGenerator = require("../helpers/utcDateGenerator");
const { getUser } = require("../middlewares/permissions");

module.exports = {
  list: async (req, res) => {
    /*
      #swagger.tags = ["Reservations"]
      #swagger.summary = "List Reservations <Permissions: Login>"
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
    const user = getUser(req);
    // user yalnizca kendi reservation'larini goruntuleyebilsin
    let filter = { destroyTime: null };
    if (!(user.isAdmin || user.isStaff)) {
      filter.userId = user._id;
    }

    const data = await res.getModelList(Reservation, filter, [
      { path: "userId", select: "username firstName lastName" },
      { path: "carId" },
      { path: "createdId", select: "username" },
      { path: "updatedId", select: "username" },
    ]);

    res.status(200).send({
      error: false,
      details: await res.getModelListDetails(Reservation, filter),
      result: data,
    });
  },

  create: async (req, res, next) => {
    /*
      #swagger.tags = ["Reservations"]
      #swagger.summary = "Create Reservation <Permissions: Login>"
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
          userId: "660b113091cd968f2b061318",
          carId: "660b1ff6bf7f8c0d1730e39b",
          startDate: "2024-10-14",
          endDate: "2024-10-20"
        }
      }
    */
    // $ref: '#/definitions/Reservation'
    const user = getUser(req);

    // destroyTime create ve update'te daima override edilir
    req.body.destroyTime = null;

    // yetkisiz kullanici yalnizca kendi adina rezervasyon yapabilir, userId gonderilmediyse de yalnizca kendi adina rezervasyon yapabilir
    if (!(user.isAdmin || user.isStaff) || !req.body.userId) {
      req.body.userId = user._id;
    }

    // createdId ve updatedId verilerini user'dan al
    req.body.createdId = user._id;
    req.body.updatedId = user._id;

    // amount'a rastgele bir override yapiliyor, maksat deger girmis olmak, asil degeri pre save ile otomatik hesaplaniyor
    req.body.amount = 0;

    if (!req.body.startDate || !req.body.endDate) {
      res.status(400).send({
        error: true,
        message: "You must specify startDate and endDate on your request body.",
      });
    } else {
      // * req.body date field'larini absolute ISO 8601'e cevir
      req.body.startDate = utcDateGenerator(req.body, "startDate");
      if (req.body.endDate instanceof Error) return next(req.body.startDate);
      req.body.endDate = utcDateGenerator(req.body, "endDate");
      if (req.body.endDate instanceof Error) return next(req.body.endDate);

      // kullanicinin belirttigi tarihlerde baska bir rezervasyonu var mi?
      const userReservationInDates = await Reservation.findOne({
        userId: req.body.userId,
        $and: [
          { startDate: { $lt: req.body.endDate } },
          { endDate: { $gt: req.body.startDate } },
        ],
      });
      console.log(
        "🔭 ~ create: ~ userReservationInDates ➡ ➡ ",
        userReservationInDates
      );

      if (userReservationInDates) {
        throw new Error(
          "You have a different reservation between specified dates.",
          { cause: { userReservationInDates } }
        );
      } else {
        const data = await Reservation.create(req.body);

        res.status(201).send({
          error: false,
          data,
        });
      }
    }
  },

  read: async (req, res) => {
    /*
      #swagger.tags = ["Reservations"]
      #swagger.summary = "Get Single Reservation <Permissions: Login>"
    */
    const user = getUser(req);
    // user yalnizca kendi reservation'larini goruntuleyebilsin
    let filter = { destroyTime: null };
    if (!(user.isAdmin || user.isStaff)) {
      filter.userId = user._id;
    }

    const data = await Reservation.findOne({
      _id: req.params.reservationId,
      ...filter,
    }).populate([
      { path: "userId", select: "username firstName lastName" },
      { path: "carId" },
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
      #swagger.tags = ["Reservations"]
      #swagger.summary = "Update Reservation <Permissions: Staff>"
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
          userId: "660b113091cd968f2b061318",
          carId: "660b1ff6bf7f8c0d1730e39b",
          startDate: "2024-11-14",
          endDate: "2024-11-20"
        }
      }
    */
    // $ref: '#/definitions/Reservation'
    const user = getUser(req);

    // destroyTime body'den siliniyor
    delete req.body?.destroyTime;

    // * req.body'de date field'lari varsa absolute ISO 8601'e cevir
    if (req.body?.startDate) {
      req.body.startDate = utcDateGenerator(req.body, "startDate");
      if (req.body.endDate instanceof Error) return next(req.body.startDate);
    }
    if (req.body?.endDate) {
      req.body.endDate = utcDateGenerator(req.body, "endDate");
      if (req.body.endDate instanceof Error) return next(req.body.endDate);
    }

    // Admin degilse rezervasyona ait userId degistirilemez
    if (!user.isAdmin) {
      delete req.body.userId;
    }

    // updatedId verisini user'dan al
    req.body.updatedId = user._id;

    // amount'a rastgele bir override yapiliyor, maksat deger girmis olmak, asil degeri pre save ile otomatik hesaplaniyor
    if (req.body.amount) req.body.amount = 0;

    // Güncellenmek istenen reservation'in mevcut bilgilerini al.
    // Belgeyi bul
    const reservation = await Reservation.findOne({
      _id: req.params.reservationId,
      destroyTime: null,
    });
    if (!reservation) {
      // Belge bulunamadıysa hata döndür
      return res.status(404).json({
        error: true,
        message: "Reservation not found",
      });
    }

    // https://mongoosejs.com/docs/api/document.html#Document.prototype.markModified()
    // req.body ile bir field gelmisse document'ta markModified yapildiginda her durumda bu field'in degistigi algilanacaktir.
    if (req.body?.startDate) {
      reservation.markModified("startDate");
    }

    if (req.body?.endDate) {
      reservation.markModified("endDate");
    }

    // req.body'de carId varsa rezervation tarihlerinde uygun mu kontrol et
    if (req.body.carId) {
      const car = await Car.findById(req.body.carId);
      if (!car.isAvailable)
        return next(
          new Error("This car is not available.", { cause: { car } })
        );
      const carReservations = await Reservation.find({
        carId: req.body.carId,
        _id: { $ne: reservation._id },
      });
      let reservationStartDate, reservationEndDate;
      if (req.body.startDate) {
        reservationStartDate = req.body.startDate;
      } else {
        reservationStartDate = reservation.startDate;
      }
      if (req.body.endDate) {
        reservationEndDate = req.body.endDate;
      } else {
        reservationEndDate = reservation.startDate;
      }
      if (carReservations.length) {
        for (const carReservation of carReservations) {
          if (
            new Date(reservationStartDate) < new Date(carReservation.endDate) &&
            new Date(reservationEndDate) > new Date(carReservation.startDate)
          ) {
            return next(
              new Error(
                "This car had been reserved between the start and end dates of queried reservations.",
                { cause: { reservation, carReservation } }
              )
            );
          }
        }
      }
    }

    // Schema'da tanımlı alanları al
    // https://mongoosejs.com/docs/api/schema.html#Schema.prototype.paths
    // The paths defined on this schema. The keys are the top-level paths in this schema, and the values are instances of the SchemaType class.
    // const schema = new Schema({ name: String }, { _id: false });
    // schema.paths; // { name: SchemaString { ... } }
    const schemaKeys = Object.keys(Reservation.schema.paths);

    // req.body içindeki key'leri döngü ile işle
    Object.keys(req.body).forEach((key) => {
      // Eğer key schema'da varsa, document değerini güncelle
      if (schemaKeys.includes(key)) {
        reservation[key] = req.body[key];
      }
    });

    // Document'i kaydet
    const updatedDoc = await reservation.save();

    // const data = await Reservation.updateOne({ _id: req.params.reservationId }, req.body, {
    //   runValidators: true,
    // });

    res.status(202).send({
      error: false,
      body: req.body,
      result: updatedDoc,
    });
  },

  destroy: async (req, res) => {
    /*
      #swagger.tags = ["Reservations"]
      #swagger.summary = "Delete Reservation <Permissions: Admin>"
    */

    // Soft delete:
    const reservation = await Reservation.findById(req.params.reservationId);
    if (reservation) {
      const localeDate = new Date();

      reservation.destroyTime = localeDate;

      const deletedReservation = await reservation.save();

      res.status(204).send({
        error: false,
        deletedReservation,
      });
    } else {
      res.status(404).send({
        error: true,
        message: "Reservation not found",
      });
    }
  },
};
