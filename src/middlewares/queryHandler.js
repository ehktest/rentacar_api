"use strict";

const { mongoose } = require("../configs/dbConnection");

module.exports = (req, res, next) => {
  // * Req.query'den deconstruction
  let {
    filter = {},
    search: rawSearch = {},
    sort = {},
    limit: rawLimit = process.env?.PAGE_SIZE,
    page: rawPage = 1,
    skip: rawSkip = 0,
  } = req.query;

  // * Number field'larda search yapmak mantiksizdir cunku regex yalnizca string'lerde calisir, number field'larda filter yani kesin sonuc aramasi yaptirilabilir, bu da request ile string bile girilse == ile eslesme varsa(1 == "1") true donecektir.

  const search = Object.entries(rawSearch).reduce((acc, [key, value]) => {
    // * regex yalnizca string'lerle calisir, number field'larla calismaz, bu nedenle number field'larda search calismayacaktir ve number field'lar icin search kullanilmamalidir.
    if (!isNaN(value) && value.trim() !== "") {
      // Eğer değer sayısal bir değerse ve boş bir string değilse
      acc[key] = { $regex: value }; // Flag olmadan regex kullan
    } else {
      // Değer metinsel bir ifadeyse
      acc[key] = { $regex: value, $options: "i" }; // i flag'li regex kullan
    }
    return acc;
  }, {});

  let limit = Number(rawLimit);
  limit = limit > 0 ? limit : process.env?.PAGE_SIZE;

  let page = Number(rawPage);
  page = page > 0 ? page - 1 : 0;

  let skip = Number(rawSkip);
  skip = skip > 0 ? skip : page * limit;

  // * Foreign key'in yalnizca id'sini gormektense document'in kendisini nested olarak gormek icin populate(foreignKeyFieldName) methodu kullanilabilir. Populate hangi model'den ObjectId ile document dondurecegini field'taki ref key'ine girilmis olan model ismi ile belirleyecektir.
  // https://mongoosejs.com/docs/api/query.html#Query.prototype.populate()
  res.getModelList = async function (Model, condition = {}, populate = null) {
    return await Model.find({ ...filter, ...search, ...condition })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate);
  };

  // Details:
  // * pagination detail'leri ayri bir async function ile response'ta donulebilir, bu frontend pagination icin oldukca elverislidir, ekstra hic bir package/logic kullanmaya gerek kalmaz.
  res.getModelListDetails = async (Model, condition = {}) => {
    const data = await Model.find({ ...filter, ...search, ...condition });

    let details = {
      filter,
      search,
      sort,
      skip,
      limit,
      page,
      pages: {
        previous: page > 0 ? page : false,
        current: page + 1,
        next: page + 2,
        total: Math.ceil(data.length / limit),
      },
      totalRecords: data.length,
    };
    // pages.next pages.total'dan buyuk oldugu anda false yap
    details.pages.next =
      details.pages.next > details.pages.total ? false : details.pages.next;
    // donen document sayisi pagination item sayisindan kucukse pagination(details.pages) deaktif
    if (details.totalRecords <= limit) details.pages = false;
    return details;
  };

  next();
};
