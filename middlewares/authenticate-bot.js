"use strict"
const { User } = require("../models")
const { decodeToken } = require("../utils")
const { MESSAGE } = require("../constants")

const authenticateBot = async (req, res, next) => {
  try {
    const { authorization } = req.headers
    if (!authorization || authorization.split(" ")[0] !== "Bearer") {
      throw { status: 401, message: MESSAGE.INVALID_TOKEN }
    }

    const token = authorization.split(" ")[1]
    const { tokenType, tokenData } = decodeToken(token)
    if (!tokenType || !tokenData || !tokenData.id) {
      throw { status: 401, message: MESSAGE.INVALID_TOKEN }
    }

    if (!tokenData.isVerified) {
      throw { status: 401, message: MESSAGE.UNVERIFIED_USER }
    }

    const user = await User.findByPk(tokenData.id)
    if (!user) {
      throw { status: 401, message: MESSAGE.INVALID_TOKEN }
    }
    
    if (!user.isVerified) {
      throw { status: 401, message: MESSAGE.UNVERIFIED_USER }
    }

    req.userData = {
      ...user.dataValues,
      tokenType
    }

    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      error.status = 401
      error.message = MESSAGE.INVALID_TOKEN
    }
    next(error)
  }
}

module.exports = authenticateBot