const routes = require("express").Router()
const { Link } = require("../controllers")
const { authenticate, authorizeLink } = require("../middlewares")

routes.get("/link/lists", authenticate, Link.GetLinkList)
routes.post("/link/create", authenticate, Link.CreateLink)
routes.get("/link/detail/:id", authenticate, authorizeLink, Link.GetLinkDetail)
routes.put("/link/edit/:id", authenticate, authorizeLink, Link.UpdateLink)
routes.patch("/link/status/:id", authenticate, authorizeLink, Link.UpdateLinkStatus)

routes.post("/link/short/:path", Link.FindUniqueLink)
routes.post("/link/public/create", Link.CreateLink)

module.exports = routes
