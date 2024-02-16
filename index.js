if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}

const express = require("express")
const cors = require("cors")
const expressip = require("express-ip")
const routes = require("./routes")
const { errorHandler } = require("./middlewares")

const port = process.env.PORT || 3000
const app = express()

app.set("trust proxy", true)
app.use(express.json())
app.use(cors())
app.use(expressip().getIpInfoMiddleware)
app.use(express.urlencoded({ extended: false }))
app.use(routes)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})
