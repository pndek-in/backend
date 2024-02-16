"use strict"
const bcrypt = require("bcrypt")
const salt = +process.env.SALT

const hash = async (string) => {
  const hashedString = await bcrypt.hash(string, salt)
  return hashedString
}

const compareHash = async (string, hashedString) => {
  const comparedString = await bcrypt.compare(string, hashedString)
  return comparedString
}

module.exports = {
  hash,
  compareHash
}
