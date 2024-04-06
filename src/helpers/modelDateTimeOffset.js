"use strict";

module.exports = {
  dateFieldTimeOffset: (val) => {
    // Gelen degerin Date objesi olup olmadigini ve gecerli bir tarih temsil edip etmedigini kontrol et
    if (val instanceof Date && !isNaN(val.getTime())) {
      // Gelen deger bir Date objesi ise ve gecerli bir tarih temsil ediyorsa, uzerine 3 saat ekle(UTC+3)
      return new Date(val.getTime() + 3 * 60 * 60 * 1000);
    } else {
      // Gelen deger bir Date objesi degilse veya gecerli bir tarih temsil etmiyorsa, dogrudan val'i dondur
      return val;
    }
  },
  timeStampsOffset: () => {
    let date = new Date();
    let newDate = new Date(
      // date.getTime() - date.getTimezoneOffset() * 60 * 1000
      date - date.getTimezoneOffset() * 60 * 1000
    );
    return newDate;
  },
};
