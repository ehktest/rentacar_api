"use strict";

const dateValidator = require("./dateValidator");

// - Auto UTC -> Absolute Time
module.exports = (body, date) => {
  // * Date object’lerinde 2024-03-01 olarak tarih verildiginde UTC’ye gore otomatik calisirken 2024-3-1 olarak verildiginde yaz saati uygulamasini dahil ederek calismaya baslar. Bundan etkilenmemek icin new Date(Date.UTC(year, month, day, hour, minute, second)) olarak tarih belirlenebilir.
  const dateInput = body[date]; // Orn: "2024-03-01"
  if (!dateValidator(dateInput)) {
    return new Error(`Given date(${dateInput}) is not valid`);
  }
  let datePart,
    timePart = "00:00:00"; // default saat degeri

  if (dateInput.includes("T")) {
    [datePart, timePart] = dateInput.split("T");
  } else {
    datePart = dateInput;
  }

  const [year, month, day] = datePart
    .split("-")
    .map((num) => parseInt(num, 10));
  let [hours, minutes, seconds] = timePart
    .split(":")
    .map((num) => parseInt(num, 10));

  // JS'de aylar 0'dan baslar, bu yuzden ay degerinden 1 cikarilmali.
  let utcDate = new Date(
    Date.UTC(year, month - 1, day, hours, minutes, seconds)
  ).toISOString();

  return utcDate;
};
