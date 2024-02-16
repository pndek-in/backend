"use strict"
const jwt = require("jsonwebtoken")
const { MESSAGE } = require("../constants")

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET)
}

const decodeToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    throw {
      status: 401,
      message: MESSAGE.INVALID_TOKEN
    }
  }
}

module.exports = {
  generateToken,
  decodeToken
}
