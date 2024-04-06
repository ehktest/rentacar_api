"use strict";

// Auth Controller

const User = require("../models/user");
const Token = require("../models/token");
const passwordEncrypt = require("../helpers/passwordEncrypt");
const jwt = require("jsonwebtoken");
const refreshAccessToken = require("../helpers/refreshAccessToken");

module.exports = {
  login: async (req, res) => {
    /*
      #swagger.tags = ["Authentication"]
      #swagger.summary = "Login <Permissions: Public>"
      #swagger.description = 'Login with username (or email) and password for get classicToken and JWT'
      #swagger.parameters["body"] = {
          in: "body",
          required: true,
          schema: {
              "username": "admin",
              "password": "Qwer1234!",
          }
      }
    */

    // ? eger kullanici zaten login olmussa istegi degerlendirmesin
    if (process.env.NODE_ENV === "production" && req.isUserAuthenticated)
      throw new Error(
        "You are already logged in. Clear cookies or dont send any token/jwt access token on Authorization header to re-login."
      );

    const { username, password, email } = req.body;

    if ((username || email) && password) {
      const user = await User.findOne({ $or: [{ username }, { email }] });

      if (user && user.password == passwordEncrypt(password)) {
        if (user.isActive) {
          /* TOKEN */

          let tokenData = await Token.findOne({ userId: user._id });

          if (!tokenData) {
            const tokenKey = passwordEncrypt(user._id + Date.now());
            tokenData = await Token.create({
              userId: user._id,
              token: tokenKey,
            });
          }

          /* TOKEN */

          /* JWT */

          // daha kritik/hassas veri, daha kisa omurlu
          const accessInfo = {
            key: process.env.ACCESS_KEY,
            time: process.env?.ACCESS_EXP || "30m",
            data: {
              _id: user._id,
              id: user.id,
              email: user.email,
              isActive: user.isActive,
              isAdmin: user.isAdmin,
              isStaff: user.isStaff,
            },
          };

          // daha az kritik/hassas veri, daha uzun omurlu
          const refreshInfo = {
            key: process.env.REFRESH_KEY,
            time: process.env?.REFRESH_EXP || "3d",
            data: {
              id: user.id,
              password: user.password, // encyrpted
            },
          };

          // JWT token'lari olustur(jwt.sign)
          // jwt.sign(payload, secretOrPrivateKey, [options, callback])
          const accessToken = jwt.sign(accessInfo.data, accessInfo.key, {
            expiresIn: accessInfo.time,
          });

          const refreshToken = jwt.sign(refreshInfo.data, refreshInfo.key, {
            expiresIn: refreshInfo.time,
          });
          // console.log('refreshToken', refreshToken)

          /* JWT */

          /* COOKIE */
          if (req.session) {
            req.session.id = user.id;
            req.session.password = user.password;
            req.session.token = tokenData.token;
            req.session.accessToken = accessToken;
            req.session.refreshToken = refreshToken; // COOKIE ILE REFRESH TOKEN'I GONDERMEK MANTIKLI OLSA DA MOBILE APPLICATION'LAR COOKIE DESTEKLEMEDIGI ICIN ONLAR OZELINDE HEADER KULLANARAK JWT AUTH'A DEVAM ETMEK BEST-PRACTICE'TIR.
          }
          /* COOKIE */

          res.status(200).send({
            error: false,
            token: tokenData.token,
            bearer: {
              access: accessToken,
              refresh: refreshToken,
            },
            user,
          });
        } else {
          res.errorStatusCode = 401;
          throw new Error("This account is not active.");
        }
      } else {
        res.errorStatusCode = 401;
        throw new Error("Wrong username or password.");
      }
    } else {
      res.errorStatusCode = 401;
      throw new Error("Please enter username and password.");
    }
  },

  refresh_browsers: async (req, res) => {
    /*
      #swagger.tags = ["Authentication"]
      #swagger.summary = "JWT: Refresh - Cookie <Permissions: Public>"
      #swagger.description = 'Refresh access token via cookie.'
    */

    if (req.session?.id) {
      // BROWSER'LAR ICIN REFRESH TOKEN'I HTTPONLY COOKIE ILE GONDERMEK COK DAHA GUVENLIDIR
      const refreshToken = req.session?.refreshToken;
      const newAccessToken = await refreshAccessToken(refreshToken);
      res.status(200).json({
        error: false,
        bearer: { access: newAccessToken },
      });
    } else {
      res.status(200).json({
        error: true,
        message:
          "You cant use this endpoint because you are not using cookies.",
      });
    }
  },

  refresh_others: async (req, res) => {
    /*
      #swagger.tags = ["Authentication"]
      #swagger.summary = "JWT: Refresh - API <Permissions: Public>"
      #swagger.description = 'Refresh access token via refresh token. You need to set your refresh token to X-Refresh-Token header to refresh your access token.'
    */

    // * header ile X-Refresh-Token custom key'i ile API refresh'i handle etmek, post ile body'den refresh token gondermeye gore daha guvenlidir ve method esnekligi sunar. Boyle oldugunda get istegi de yeterli olur cookie'de oldugu gibi, mobile application'larda header ile veri iletmek sik kullanilan bir yontemdir.

    const refreshToken = req.headers?.["x-refresh-token"];

    if (!refreshToken) {
      res.status(401).json({
        error: true,
        message: "You must set your refresh token to X-Refresh-Token header.",
      });
    } else {
      const newAccessToken = await refreshAccessToken(refreshToken);
      res.status(200).json({
        error: false,
        bearer: { access: newAccessToken },
      });
    }
  },

  logout: async (req, res) => {
    /*
      #swagger.tags = ["Authentication"]
      #swagger.summary = "Classic Token Logout <Permissions: Public>"
      #swagger.description = 'Delete token key.'
    */

    /* SESSION */
    if (req.session?.id) {
      req.session = null;
    }
    /* SESSION */

    /* TOKEN */
    const auth = req.headers?.authorization || null; // Token ...tokenKey...
    const tokenKey = auth ? auth.split(" ") : null; // ['Token', '...tokenKey...']

    let tokenData;
    if (tokenKey && tokenKey[0] === "Token") {
      tokenData = await Token.deleteOne({ token: tokenKey[1] });

      res.send({
        error: false,
        message:
          "Cookies deleted if there were any, token key successfully destroyed if it is valid.",
        result: tokenData,
      });
      /* TOKEN */
    } else {
      res.status(401).json({
        error: true,
        message:
          "Cookies deleted if there were any but token key not found on headers. You must set your token key to Authorization header using the format 'Token ...tokenKey...'.",
      });
    }

    // JWT'de logout yoktur, auto expire vardir
  },
};
