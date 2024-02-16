"use strict"
const generateRandomString = (length) => {
  const characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const upperCaseFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const kebabToCamel = (string) => {
  return string.replace(/-([a-z])/g, function (g) {
    return g[1].toUpperCase()
  })
}

module.exports = {
  generateRandomString,
  upperCaseFirstLetter,
  kebabToCamel
}
