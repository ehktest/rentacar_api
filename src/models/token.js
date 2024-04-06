"use strict";

const { mongoose } = require("../configs/dbConnection");
const { Schema, models, model } = mongoose;
/* ------------------------------------------------------- *
{
  "userId": "65343222b67e9681f937f001",
  "token": "...tokenKey..."
}
/* ------------------------------------------------------- */
// Token Model:

const TokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
  },
  {
    collection: "token",
    timestamps: {
      currentTime: () => {
        let date = new Date();
        let newDate = new Date(
          date.getTime() - date.getTimezoneOffset() * 60 * 1000
        );
        return newDate;
      },
    },
  }
);

/* ------------------------------------------------------- */
module.exports = models?.Token || model("Token", TokenSchema);
