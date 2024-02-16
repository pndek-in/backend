const routes = require("express").Router()
const { Auth } = require("../controllers")
const { authenticate } = require("../middlewares")

routes.post("/auth/register", Auth.Register)
routes.post("/auth/login", Auth.Login)
routes.post("/auth/google-auth", Auth.GoogleAuth)
routes.get("/auth/me", authenticate, Auth.GetMe)

module.exports = routes
