"use strict"
const { Op } = require("sequelize")
const { randomize } = require("string-randomify")
const WebServiceClient = require("@maxmind/geoip2-node").WebServiceClient
const isBot = require("isbot")

const Redis = require("../controllers/redis")
const { Link, Click } = require("../models")
const { STATUS, PATH } = require("../constants")
const {
  convertToUnixTimestamp,
  compareUnixTimestamp,
  compareHash,
  hash,
  isURLSafe,
  appendHttps,
  isURLValid
} = require("../utils")

class LinkController {
  static async GetLinkList(req, res, next) {
    try {
      const { status = 1 } = req.query
      const { userData } = req
      const links = await Link.findAll({
        where: {
          userId: userData.userId,
          status
        },
        attributes: [
          "linkId",
          "url",
          "path",
          "description",
          "status",
          "expiredAt",
          "userId",
          "createdAt",
          "secretCode",
          "totalClick"
        ],
        order: [["createdAt", "DESC"]]
      })

      const lists = links.map((link) => {
        return {
          linkId: link.linkId,
          url: link.url,
          path: link.path,
          description: link?.description,
          status: link.status,
          expiredAt: link?.expiredAt,
          userId: link.userId,
          createdAt: link.createdAt,
          totalClick: link.totalClick,
          hasSecretCode: !!link.secretCode
        }
      })

      res.status(200).json({
        message: "Links is successfully retrieved",
        data: lists
      })
    } catch (error) {
      next(error)
    }
  }

  static async GetLinkDetail(req, res, next) {
    try {
      const { id } = req.params
      const { start, end } = req.query

      if (!start || !end)
        throw { status: 400, message: "Start and end date is required" }

      const link = await Link.findOne({
        where: {
          linkId: id
        },
        attributes: [
          "linkId",
          "url",
          "path",
          "title",
          "status",
          "expiredAt",
          "userId",
          "createdAt",
          "secretCode",
          "totalClick"
        ]
      })

      if (!link) throw { status: 404, message: "Link is not found" }

      const clicks = await Click.findAll({
        where: {
          linkId: id,
          clickedAt: {
            [Op.between]: [start, end]
          }
        },
        attributes: [
          "clickId",
          "linkId",
          "clickedAt",
          "userAgent",
          "referrer",
          "source",
          "visitor"
        ]
      })

      const visitors = []
      clicks.forEach((click) => {
        if (!visitors.includes(click.visitor)) visitors.push(click.visitor)
      })

      const totalFromQr = clicks.filter((click) => click.source === "qr").length

      res.status(200).json({
        message: "Link is successfully retrieved",
        data: {
          linkId: link.linkId,
          url: link.url,
          path: link.path,
          title: link?.title,
          status: link.status,
          expiredAt: link?.expiredAt,
          userId: link.userId,
          createdAt: link.createdAt,
          hasSecretCode: !!link.secretCode,
          totalClick: link.totalClick,
          uniqueVisitor: visitors.length,
          totalFromQr,
          clicks
        }
      })
    } catch (error) {
      next(error)
    }
  }

  static async generateRandomPath() {
    const randomString = randomize(5)
    const link = await Link.findOne({
      where: {
        path: randomString
      },
      attributes: ["path"]
    })

    if (link || PATH.UNAUTHORIZED.includes(randomString)) {
      // if link is exist or path is unauthorized, generate new random string
      return LinkController.generateRandomPath()
    }
    return randomString
  }

  static async CreateLinkHelper(payload) {
    try {
      const {
        url,
        description,
        expiredAt,
        secretCode,
        status,
        userId,
        source
      } = payload

      if (!url) throw { status: 400, message: "Original URL is required" }

      const isUrlSafe = await isURLSafe(url)

      if (!isUrlSafe) throw { status: 400, message: "URL is not safe" }

      const isUrlValid = isURLValid(url)

      if (!isUrlValid) throw { status: 400, message: "URL is not valid" }

      const path = await LinkController.generateRandomPath()

      const newLink = await Link.create({
        url: appendHttps(url),
        path,
        description,
        expiredAt,
        secretCode,
        status,
        userId,
        source
      })

      Redis.UpdateRedis("totalLink")

      return newLink
    } catch (error) {
      throw error
    }
  }

  static async CreateLink(req, res, next) {
    try {
      const { url, description, expiredAt, secretCode } = req.body
      const { source } = req.query
      const { userData } = req
      const status = STATUS.ACTIVE

      const newLink = await LinkController.CreateLinkHelper({
        url,
        description,
        expiredAt,
        secretCode,
        status,
        userId: userData.userId,
        source: source || "web"
      })

      res.status(201).json({
        message: "Link is successfully created",
        data: {
          linkId: newLink.linkId,
          url: newLink.url,
          path: newLink.path,
          description: newLink?.description,
          status: newLink.status,
          expiredAt: newLink?.expiredAt,
          userId: newLink.userId,
          createdAt: newLink.createdAt,
          hasSecretCode: !!newLink.secretCode
        }
      })
    } catch (error) {
      next(error)
    }
  }

  static async CreateLinkWithoutAuth(req, res, next) {
    try {
      const { url, description, expiredAt, secretCode } = req.body
      const { source } = req.query
      const status = STATUS.ACTIVE

      const newLink = await LinkController.CreateLinkHelper({
        url,
        description,
        expiredAt,
        secretCode,
        status,
        userId: 1,
        source: source || "web"
      })

      res.status(201).json({
        message: "Link is successfully created",
        data: {
          linkId: newLink.linkId,
          url: newLink.url,
          path: newLink.path,
          description: newLink?.description,
          status: newLink.status,
          expiredAt: newLink?.expiredAt,
          userId: newLink.userId,
          createdAt: newLink.createdAt,
          hasSecretCode: !!newLink.secretCode
        }
      })
    } catch (error) {
      next(error)
    }
  }

  static async ClaimLink(req, res, next) {
    try {
      const { id } = req.body
      const { userData } = req

      const link = await Link.findByPk(id)

      if (!link) {
        throw { status: 404, message: "Link not found" }
      }

      if (link.userId !== 1) {
        throw { status: 400, message: "Link is already claimed" }
      }

      const updatedLink = await Link.update(
        {
          userId: userData.userId
        },
        {
          where: {
            linkId: id
          },
          returning: true
        }
      )

      res.status(200).json({
        message: "Link is successfully claimed",
        data: {
          linkId: updatedLink[1][0].linkId,
          url: updatedLink[1][0].url,
          path: updatedLink[1][0].path,
          description: updatedLink[1][0]?.description,
          status: updatedLink[1][0].status,
          expiredAt: updatedLink[1][0]?.expiredAt,
          userId: updatedLink[1][0].userId,
          createdAt: updatedLink[1][0].createdAt,
          hasSecretCode: !!updatedLink[1][0].secretCode
        }
      })
    } catch (error) {
      next(error)
    }
  }

  static async UpdateLink(req, res, next) {
    try {
      const { id } = req.params
      const { description, expiredAt, secretCode, path } = req.body
      const newSecret = secretCode ? await hash(secretCode) : null
      const existingData = req.urlData

      const payload = {
        description,
        expiredAt
      }

      if (path && path !== existingData.path) {
        const isPathExist = await Link.findOne({
          where: {
            path
          },
          attributes: ["path"]
        })

        if (isPathExist) {
          throw { status: 400, message: "New path is already taken" }
        }

        if (PATH.UNAUTHORIZED.includes(path)) {
          throw {
            status: 400,
            message: "New path is not allowed to use"
          }
        }

        const isPathValid = isURLValid(`pndek.in/${path}`)

        if (!isPathValid) {
          throw { status: 400, message: "New path is not valid" }
        }

        payload.path = path
      }

      if (secretCode) {
        payload.secretCode = newSecret
      }

      const link = await Link.update(payload, {
        where: {
          linkId: id
        },
        returning: true
      })

      res.status(200).json({
        message: "URL is successfully updated",
        data: {
          linkId: link[1][0].linkId,
          url: link[1][0].url,
          path: link[1][0].path,
          description: link[1][0]?.description,
          status: link[1][0].status,
          expiredAt: link[1][0]?.expiredAt,
          userId: link[1][0].userId,
          createdAt: link[1][0].createdAt,
          hasSecretCode: !!link[1][0].secretCode
        }
      })
    } catch (error) {
      next(error)
    }
  }

  static async UpdateLinkStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status } = req.body

      const link = await Link.update(
        {
          status
        },
        {
          where: {
            linkId: id
          },
          returning: true
        }
      )

      res.status(200).json({
        message: "URL status is successfully updated",
        data: {
          linkId: link[1][0].linkId,
          url: link[1][0].url,
          path: link[1][0].path,
          title: link[1][0]?.title,
          status: link[1][0].status,
          expiredAt: link[1][0]?.expiredAt,
          userId: link[1][0].userId,
          createdAt: link[1][0].createdAt,
          hasSecretCode: !!link[1][0].secretCode
        }
      })
    } catch (error) {
      next(error)
    }
  }

  static async InsertClickData({
    link,
    userAgent,
    referrer,
    source,
    visitor,
    ipInfo
  }) {
    let country = "N/A"
    let city = "N/A"

    try {
      const GEOLITE_ACCOUNT_ID = process.env.GEOLITE_ACCOUNT_ID
      const GEOLITE_LICENSE_KEY = process.env.GEOLITE_LICENSE_KEY
      const client = new WebServiceClient(
        GEOLITE_ACCOUNT_ID,
        GEOLITE_LICENSE_KEY,
        {
          host: "geolite.info"
        }
      )

      let ipAddress = ipInfo.ip
      // If IP address includes comma, extract the first one
      if (ipAddress.includes(",")) {
        ipAddress = ipAddress.split(",")[0].trim()
      }

      const geolite = await client.city(ipAddress)
      country = geolite?.country?.names?.en || "N/A"
      city = geolite?.city?.names?.en || "N/A"
    } catch (error) {
      console.log(error, " | error from geolite")
    }

    Click.create({
      linkId: link.linkId,
      userAgent,
      referrer,
      source,
      visitor,
      country,
      city
    })

    Redis.UpdateRedis("totalClick")

    Link.update(
      {
        totalClick: link.totalClick + 1
      },
      {
        where: {
          linkId: link.linkId
        }
      }
    )
  }

  static async FindUniqueLink(req, res, next) {
    try {
      const { unlock } = req.query
      const { path } = req.params
      const { referrer, source, secretCode, visitor } = req.body
      const userAgent = req.headers["user-agent"]
      const ipInfo = req.ipInfo

      const link = await Link.findOne({
        where: {
          path
        },
        attributes: [
          "linkId",
          "url",
          "expiredAt",
          "secretCode",
          "totalClick",
          "status"
        ]
      })

      if (!link) throw { status: 404, message: "Link is not found" }

      if (link.status !== 1) throw { status: 410, message: "Link is inactive" }

      let hasSecretCode = !!link.secretCode
      const now = convertToUnixTimestamp(new Date())

      if (link.expiredAt && compareUnixTimestamp(now, link.expiredAt) === 1) {
        throw { status: 410, message: "Link is expired" }
      }

      if (hasSecretCode) {
        if (unlock === "true") {
          if (!secretCode) {
            throw { status: 400, message: "Secret code is required" }
          } else {
            const isSecretCodeValid = await compareHash(
              secretCode,
              link.secretCode
            )
            if (!isSecretCodeValid) {
              throw { status: 400, message: "Secret code is invalid" }
            } else {
              hasSecretCode = false
              if (!isBot(userAgent)) {
                LinkController.InsertClickData({
                  link,
                  userAgent,
                  referrer,
                  source,
                  visitor,
                  ipInfo
                })
              }
            }
          }
        }
      } else {
        if (!isBot(userAgent)) {
          LinkController.InsertClickData({
            link,
            userAgent,
            referrer,
            source,
            visitor,
            ipInfo
          })
        }
      }

      res.status(200).json({
        message: "URL is successfully retrieved",
        data: {
          url: hasSecretCode ? null : link.url,
          expiredAt: link?.expiredAt,
          hasSecretCode
        }
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = LinkController
