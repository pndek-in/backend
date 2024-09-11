const routes = require("express").Router()
const { Health } = require("../controllers")

routes.get("/health_check", Health.Check)

module.exports = routes
