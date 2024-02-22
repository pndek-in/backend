"use strict"
const { OAuth2Client } = require("google-auth-library")

const { User } = require("../models")
const { compareHash, hash, generateToken, generateRandomString } = require("../utils")

class AuthController {
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
          User.update({
            isVerified: true
          }, {
            where: {
              userId: user.userId
            }
          })
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
        const random = generateRandomString(8)
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
          id: userData.userId,
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
