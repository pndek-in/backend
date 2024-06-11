"use strict"

const upperCaseFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const kebabToCamel = (string) => {
  return string.replace(/-([a-z])/g, function (g) {
    return g[1].toUpperCase()
  })
}

module.exports = {
  upperCaseFirstLetter,
  kebabToCamel
}
