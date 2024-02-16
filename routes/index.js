const routes = require("express").Router()
const allModules = {}

require("fs")
  .readdirSync(__dirname + "/")
  .forEach(function (file) {
    if (file.match(/\.js$/) !== null && file !== "index.js") {
      const name = file.replace(".js", "")
      allModules[name] = require("./" + file)
    }
  })

for (const route in allModules) {
  routes.use(allModules[route])
}

module.exports = routes
