let allModules = {}

require("fs")
  .readdirSync(__dirname + "/")
  .forEach(function (file) {
    if (file.match(/\.js$/) !== null && file !== "index.js") {
      allModules = {
        ...allModules,
        ...require("./" + file)
      }
    }
  })

module.exports = allModules
