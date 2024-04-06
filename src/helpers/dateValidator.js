"use strict";

// Tarih string'ini kontrol etmek icin bir fonksiyon
module.exports = (dateString) => {
  const date = new Date(dateString);
  // Gecerli bir tarih nesnesi olusturulup olusturulmadigini kontrol et
  return !isNaN(date.getTime());
};
