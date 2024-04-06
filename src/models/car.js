"use strict";

const { mongoose } = require("../configs/dbConnection");
const { Schema, models, model } = mongoose;
const {
  dateFieldTimeOffset,
  timeStampsOffset,
} = require("../helpers/modelDateTimeOffset");
/* ------------------------------------------------------- *
{
    "plateNumber": "34ABC123",
    "brand": "Ford",
    "model": "Focus",
    "year": 2020,
    "isAutomatic": true,
    "pricePerDay": 249.99
}
{
    "plateNumber": "34ABC234",
    "brand": "Renault",
    "model": "Megane",
    "year": 2022,
    "isAutomatic": false,
    "pricePerDay": 199.99
}
{
    "plateNumber": "34ABC345",
    "brand": "Opel",
    "model": "Astra",
    "year": 2021,
    "isAutomatic": false,
    "pricePerDay": 189.99,
    "isPublish": false
}
/* ------------------------------------------------------- */
// Car Model:

// JavaScript'te, new anahtar kelimesi ile bir constructor fonksiyonundan nesne örnekleri oluşturulabilir. Ancak, Mongoose gibi bazı kütüphaneler, kullanıcı dostu olması için bu gerekliliği esnetebilir ve new kullanılmadan da Schema oluşturulmasına izin verebilir.

const CarSchema = Schema(
  {
    plateNumber: { type: String, trim: true, unique: true, required: true },
    brand: { type: String, trim: true, required: true },
    model: { type: String, trim: true, required: true },
    year: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 1,
      required: true,
    },
    isAutomatic: { type: Boolean, default: false },
    pricePerDay: { type: Number, required: true, min: 100, max: 500 },
    images: { type: Array, default: ["/uploads/default_car_image.png"] },
    isAvailable: { type: Boolean, default: true },
    createdId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // default: null belirler ve bir setter tanımlarsanız, bu setter fonksiyonu destroyTime alanına değer atanırken tetiklenir. Ancak, bir değer explicit olarak atanmadığı sürece (yani, destroyTime alanı için bir değer belirtmediğiniz sürece) default değer olan null atanır ve setter fonksiyonu tetiklenmez.
    destroyTime: {
      type: Date,
      default: null,
      set: dateFieldTimeOffset,
    },
  },
  {
    collections: "car",
    timestamps: { currentTime: timeStampsOffset },
  }
);

module.exports = models?.Car || model("Car", CarSchema);
