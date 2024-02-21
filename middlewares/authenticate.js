"use strict"
const { User } = require("../models")
const { decodeToken } = require("../utils")
const { MESSAGE } = require("../constants")

const authenticate = async (req, res, next) => {
  try {
    const { authorization } = req.headers
    if (!authorization || authorization.split(" ")[0] !== "Bearer") {
      throw { status: 401, message: MESSAGE.INVALID_TOKEN }
    }

    const token = authorization.split(" ")[1]
    const { userId, email } = decodeToken(token)
    if (!userId || !email) {
      throw { status: 401, message: MESSAGE.INVALID_TOKEN }
    }

    const user = await User.findByPk(userId)
    if (!user || user.email !== email) {
      throw { status: 401, message: MESSAGE.INVALID_TOKEN }
    }

    req.userData = user
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      error.status = 401
      error.message = MESSAGE.INVALID_TOKEN
    }
    next(error)
  }
}

module.exports = authenticate