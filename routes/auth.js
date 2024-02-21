const routes = require("express").Router()
const { Auth } = require("../controllers")
const { authenticate, authenticateBot } = require("../middlewares")

routes.post("/auth/register", Auth.Register)
routes.post("/auth/login", Auth.Login)
routes.post("/auth/google-auth", Auth.GoogleAuth)
routes.get("/auth/me", authenticateBot, Auth.GetMe)
routes.get("/auth/token/telegram", authenticate, Auth.GenerateTelegramToken)

module.exports = routes
