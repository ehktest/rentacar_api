"use strict";

// Token Controller:

const Token = require("../models/token");

module.exports = {
  list: async (req, res) => {
    // #swagger.ignore = true

    const data = await res.getModelList(
      Token,
      {},
      { path: "userId", select: "username email" }
    );

    res.status(200).send({
      error: false,
      details: await res.getModelListDetails(Token),
      data,
    });
  },

  create: async (req, res) => {
    // #swagger.ignore = true

    const data = await Token.create(req.body);

    res.status(201).send({
      error: false,
      data,
    });
  },

  read: async (req, res) => {
    // #swagger.ignore = true

    const data = await Token.findOne({ _id: req.params.tokenId }).populate({
      path: "userId",
      select: "username email",
    });

    res.status(200).send({
      error: false,
      data,
    });
  },

  update: async (req, res) => {
    // #swagger.ignore = true

    const data = await Token.findOneAndUpdate(
      { _id: req.params.tokenId },
      req.body,
      {
        runValidators: true,
        new: true,
      }
    ).populate({ path: "userId", select: "username email" });

    res.status(202).send({
      error: false,
      body: req.body,
      result: data,
    });
  },

  destroy: async (req, res) => {
    // #swagger.ignore = true

    const data = await Token.deleteOne({ _id: req.params.tokenId });

    res.status(data.deletedCount ? 204 : 404).send({
      error: !data.deletedCount,
      data,
    });
  },
};
