const routes = require("express").Router()
const { Stats } = require("../controllers")
const { authenticate, authorizeLink } = require("../middlewares")

routes.get("/stats/home", Stats.GetHomeStats)
routes.get("/stats/user", authenticate, Stats.GetUserStats)
routes.get("/stats/link/:id", authenticate, authorizeLink, Stats.GetLinkStats)

module.exports = routes
