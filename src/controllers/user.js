"use strict";

// User Controller:

const User = require("../models/user");
const Token = require("../models/token");
const { getUser } = require("../middlewares/permissions");

module.exports = {
  list: async (req, res) => {
    /*
      #swagger.tags = ["Users"]
      #swagger.summary = "List Users <Permissions: Staff>"
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

    const data = await res.getModelList(User, { destroyTime: null });

    res.status(200).send({
      error: false,
      details: await res.getModelListDetails(User, { destroyTime: null }),
      result: data,
    });
  },

  create: async (req, res) => {
    /*
      #swagger.tags = ["Users"]
      #swagger.summary = "Create User <Permissions: Public>"
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
          "username": "test",
          "password": "Qwer1234!",
          "email": "test@site.com",
          "isActive": true,
          "isStaff": false,
          "isAdmin": false,
        }
      }
    */
    try {
      const user = getUser(req);
      // destroyTime create ve update'te daima override edilir
      req.body.destroyTime = null;

      // login olan kullanıcı admin değilse post işleminde yetkileri false yap
      if (!user?.isAdmin) {
        req.body.isStaff = false;
        req.body.isAdmin = false;
        delete req.body.isActive;
      }

      const data = await User.create(req.body);

      res.status(201).send({
        error: false,
        result: data,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          error: true,
          message: "Username or email already exists.",
        });
      }

      res.status(500).json({
        error: true,
        message: error.message || "An error occurred while updating the user.",
      });
    }
  },

  read: async (req, res) => {
    /*
      #swagger.tags = ["Users"]
      #swagger.summary = "Get Single User <Permissions: Login>"
    */
    const user = getUser(req);

    // yetkisiz kullanıcının başka bir kullanıcıyı yönetmesini engelle (sadece kendi verileri):
    let filter = { _id: req.params.userId, destroyTime: null };
    if (!(user.isAdmin || user.isStaff)) {
      filter._id = user._id;
    }

    const data = await User.findOne(filter);

    res.status(200).send({
      error: false,
      // foundUser: await User.findOne({
      //   _id: req.params.userId,
      //   destroyTime: null,
      // }),
      result: data,
    });
  },

  update: async (req, res) => {
    /*
      #swagger.tags = ["Users"]
      #swagger.summary = "Update User <Permissions: Login>"
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
          "username": "test2",
          "password": "Qwer1234!",
          "email": "test2@site.com",
          "isActive": true,
          "isStaff": false,
          "isAdmin": false,
        }
      }
    */
    try {
      const user = getUser(req);

      // destroyTime create ve update'te daima override edilir
      req.body.destroyTime = null;

      // isAdmin hicbir sekilde degistirilemez
      delete req.body.isAdmin;

      // admin degilse kullanici yetkilerini degistiremez
      if (!user.isAdmin) {
        delete req.body.isStaff;
        delete req.body.isActive;
      }

      // yetkisiz kullanıcının başka bir kullanıcıyı yönetmesini engelle (sadece kendi verileri):
      let filter = { _id: req.params.userId };
      if (!(user.isAdmin || user.isStaff)) {
        filter._id = user._id;
      }

      const data = await User.findOneAndUpdate(filter, req.body, {
        runValidators: true,
        new: true,
      });

      res.status(202).send({
        error: false,
        body: req.body,
        // foundUser: await User.findOne({
        //   _id: req.params.userId,
        //   destroyTime: null,
        // }),
        new: data,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          error: true,
          message: "Username or email already exists.",
        });
      }

      res.status(500).json({
        error: true,
        message: error.message || "An error occurred while updating the user.",
      });
    }
  },

  destroy: async (req, res) => {
    /*
      #swagger.tags = ["Users"]
      #swagger.summary = "Delete User <Permissions: Admin>"
    */

    // Soft delete:
    const user = await User.findById(req.params.userId);
    if (user) {
      const localeDate = new Date();
      const deletedUserTokens = await Token.deleteMany({
        userId: req.params.userId,
      });

      user.destroyTime = localeDate;

      const deletedUser = await user.save();

      res.status(204).send({
        error: false,
        deletedUser,
        deletedUserTokens,
      });
    } else {
      res.status(404).send({
        error: true,
        message: "User not found",
      });
    }
  },
};
