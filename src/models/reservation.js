"use strict";

const { mongoose } = require("../configs/dbConnection");
const { Schema, models, model } = mongoose;
const Car = require("./car");
const {
  dateFieldTimeOffset,
  timeStampsOffset,
} = require("../helpers/modelDateTimeOffset");
/* ------------------------------------------------------- *
{
    "userId": "65343222b67e9681f937f001",
    "carId": "65352f518a9ea121b1ca5001",
    "startDate": "2023-10-10",
    "endDate": "2023-10-16"
}
{
    "userId": "65343222b67e9681f937f002",
    "carId": "65352f518a9ea121b1ca5002",
    "startDate": "2023-10-14",
    "endDate": "2023-10-20"
}
/* ------------------------------------------------------- */
// Reservation Model:
const ReservationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    carId: { type: Schema.Types.ObjectId, ref: "Car", required: true },
    startDate: {
      type: Date,
      required: true,
      set: dateFieldTimeOffset,
      validate: [
        function (start) {
          // 6 saat, ms cinsinden
          const sixHoursInMilliseconds = 6 * 60 * 60 * 1000;
          // su anki zaman
          const now = new Date();
          // girilen start date -> setter'da zaten Date object'e donusturuluyor
          const arrivalDate = start instanceof Date ? start : new Date(start);
          // su an ki zamandan 6 saat sonrasindan once rezervasyon olusturmaya izin verme
          const isAllowed = arrivalDate - now >= sixHoursInMilliseconds;
          return isAllowed;
        },
        "You can create reservations minimum 6 hours later than current time!",
      ],
    },
    endDate: {
      type: Date,
      required: true,
      set: dateFieldTimeOffset,
      validate: [
        {
          validator: function (end) {
            // 24 saat, ms cinsinden
            const twentyFourHoursInMilliseconds = 24 * 60 * 60 * 1000;
            // girilen start date -> setter'da zaten Date object'e donusturuluyor
            const startDate =
              this.startDate instanceof Date
                ? this.startDate
                : new Date(this.startDate);
            // girilen end date -> setter'da zaten Date object'e donusturuluyor
            const endDate = end instanceof Date ? end : new Date(end);
            // endDate ve startDate arasindaki fark uygun mu
            const isValidDuration =
              endDate - startDate >= twentyFourHoursInMilliseconds;
            return isValidDuration;
          },
          message:
            "The difference between start and end dates must be at least 1 day!",
        },
        {
          validator: function (end) {
            // 30 gun, ms cinsinden
            const thirtyDaysInMilliseconds = 30 * 24 * 60 * 60 * 1000;
            // girilen start date -> setter'da zaten Date object'e donusturuluyor
            const startDate =
              this.startDate instanceof Date
                ? this.startDate
                : new Date(this.startDate);
            // girilen end date -> setter'da zaten Date object'e donusturuluyor
            const endDate = end instanceof Date ? end : new Date(end);
            // endDate ve startDate arasindaki fark uygun mu
            const isValidDuration =
              endDate - startDate <= thirtyDaysInMilliseconds;
            return isValidDuration;
          },
          message:
            "The difference between start and end dates must be at most 30 days!",
        },
      ],
    },
    amount: { type: Number, required: true },
    createdId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    destroyTime: {
      type: Date,
      default: null,
      set: dateFieldTimeOffset,
    },
  },
  {
    collection: "reservation",
    timestamps: { currentTime: timeStampsOffset },
  }
);

// ! create ile veya find query'leriyle cekip update edip save yapildiginda calisir.
ReservationSchema.pre("save", async function (next) {
  // Eger yeni bir rezervasyon olusturuluyorsa veya 'carId'/'startDate'/'endDate' field'larindan biri degismisse amount'u yeniden hesapla.
  if (
    this.isNew ||
    this.isModified("carId") ||
    this.isModified("startDate") ||
    this.isModified("endDate")
  ) {
    const relatedCar = await Car.findById(this.carId);
    const pricePerDay = relatedCar.pricePerDay;
    const aDayInMilliseconds = 24 * 60 * 60 * 1000;
    const reservationDays = Math.ceil(
      (new Date(this.endDate) - new Date(this.startDate)) / aDayInMilliseconds
    );
    this.amount = (pricePerDay * reservationDays).toFixed(2);
  }

  next();
});

module.exports = models?.Reservation || model("Reservation", ReservationSchema);
