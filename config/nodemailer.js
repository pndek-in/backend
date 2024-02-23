const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
})

// verify connection configuration
transporter.verify(function (error) {
  if (error) {
    console.log(error, ' | error from nodemailer')
  } else {
    console.log("Server is ready to take our messages")
  }
})

module.exports = transporter