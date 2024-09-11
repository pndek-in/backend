"use strict"
const { OAuth2Client } = require("google-auth-library")
const { randomize } = require("string-randomify")

const Redis = require("../controllers/redis")
const { User } = require("../models")
const { compareHash, hash, generateToken, decodeToken } = require("../utils")
const transporter = require("../config/nodemailer")

class AuthController {
  static async SendVerificationEmail({ user, email }) {
    const mailToken = generateToken({
      tokenType: "email",
      tokenData: {
        id: user.userId,
        email: user.email
      }
    })

    const message = `
Hello, ${user.name}! Please verify your email address by clicking the link below:

https://app.pndek.in/verify?t=${mailToken}

If you didn't create an account with us, please ignore this email.
`

    const mail = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Verify your email address to access our service at pndek.in",
      text: message,
      replyTo: process.env.SMTP_EMAIL
    }

    transporter.sendMail(mail, (err) => {
      if (err) {
        console.log(err, " | error from nodemailer")
      } else {
        console.log("Email sent!", mail)
      }
    })
  }

  static async VerifyEmail(req, res, next) {
    try {
      const { token } = req.query
      const { tokenType, tokenData } = decodeToken(token)

      if (tokenType !== "email" || !tokenData.email || !tokenData.id) {
        throw { status: 400, message: "Invalid token" }
      }

      const user = await User.findOne({
        where: {
          email: tokenData.email
        },
        attributes: ["userId", "email", "isVerified"]
      })

      if (
        !user ||
        user.userId !== tokenData.id ||
        user.email !== tokenData.email ||
        user.isVerified
      ) {
        throw { status: 400, message: "Invalid token" }
      }

      await User.update(
        {
          isVerified: true
        },
        {
          where: {
            userId: user.userId
          }
        }
      )

      res.status(200).json({
        message: "Email is successfully verified"
      })
    } catch (error) {
      next(error)
    }
  }

  static async RequestVerifEmail(req, res, next) {
    try {
      const userData = req.userData

      AuthController.SendVerificationEmail({
        user: userData,
        email: userData.email
      })

      res.status(200).json({
        message: "Verification email is successfully sent"
      })
    } catch (error) {
      next(error)
    }
  }

  static async Register(req, res, next) {
    try {
      const { email, password, name } = req.body
      if (!email || !password) {
        throw { status: 400, message: "Email and password are required" }
      }

      const user = await User.create({
        email,
        password,
        name,
        isVerified: false
      })

      const token = generateToken({
        userId: user.userId,
        email: user.email
      })

      AuthController.SendVerificationEmail({ user, email })
      Redis.UpdateRedis("totalUser")

      res.status(201).json({
        message: "User is successfully created",
        data: {
          isVerified: user.isVerified,
          email: user.email,
          name: user.name,
          token
        }
      })
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        error.status = 400
        error.message = "Email is already registered"
      }
      next(error)
    }
  }

  static async Login(req, res, next) {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        throw { status: 400, message: "Email and password are required" }
      }

      const user = await User.findOne({
        where: {
          email
        },
        attributes: ["userId", "email", "password", "name", "isVerified"]
      })

      if (!user) {
        throw { status: 400, message: "Invalid email or password!" }
      } else {
        const comparedPassword = await compareHash(password, user.password)
        if (!comparedPassword) {
          throw { status: 400, message: "Invalid email or password!" }
        } else {
          const token = generateToken({
            userId: user.userId,
            email: user.email
          })

          res.status(200).json({
            message: "Login is successful",
            data: {
              isVerified: user.isVerified,
              email: user.email,
              name: user.name,
              token
            }
          })
        }
      }
    } catch (error) {
      next(error)
    }
  }

  static async GoogleAuth(req, res, next) {
    try {
      const { credential } = req.body
      const client = new OAuth2Client()

      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      })
      const payload = ticket.getPayload()
      const { email, name } = payload

      const user = await User.findOne({
        where: {
          email
        },
        attributes: ["userId", "email", "password", "name", "isVerified"]
      })

      if (user) {
        const token = generateToken({
          userId: user.userId,
          email: user.email
        })

        // Update isVerified to true if it's false if user login with google
        if (!user.isVerified) {
          User.update(
            {
              isVerified: true
            },
            {
              where: {
                userId: user.userId
              }
            }
          )
        }

        res.status(200).json({
          message: "Login is successful",
          data: {
            isVerified: true,
            email: user.email,
            name: user.name,
            token
          }
        })
      } else {
        const random = randomize(8)
        const hashedPassword = await hash(random)
        const newUser = await User.create({
          email,
          password: hashedPassword,
          name,
          isVerified: true
        })

        const token = generateToken({
          userId: newUser.userId,
          email: newUser.email
        })

        Redis.UpdateRedis("totalUser")

        res.status(201).json({
          message: "User is successfully created",
          data: {
            isVerified: newUser.isVerified,
            email: newUser.email,
            name: newUser.name,
            token
          }
        })
      }
    } catch (error) {
      next(error)
    }
  }

  static async GetMe(req, res, next) {
    try {
      const userData = req.userData

      res.status(200).json({
        message: "Get user data is successful",
        data: {
          isVerified: userData.isVerified,
          id: userData.userId
        }
      })
    } catch (error) {
      next(error)
    }
  }

  static async GenerateTelegramToken(req, res, next) {
    try {
      const { userData } = req
      const token = generateToken({
        tokenType: "telegram",
        tokenData: {
          id: userData.userId,
          isVerified: userData.isVerified,
          email: userData.email
        }
      })

      res.status(200).json({
        message: "Token is successfully generated",
        data: {
          token
        }
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = AuthController
