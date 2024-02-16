const { kebabToCamel } = require("../utils/string")
const allModules = {}

require("fs")
  .readdirSync(__dirname + "/")
  .forEach(function (file) {
    if (file.match(/\.js$/) !== null && file !== "index.js") {
      const name = file.replace(".js", "")
      const key = kebabToCamel(name.toUpperCase())
      allModules[key] = require("./" + file)
    }
  })

module.exports = allModules
