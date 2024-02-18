"use strict"
const { Op } = require("sequelize")
const WebServiceClient = require("@maxmind/geoip2-node").WebServiceClient
const { Link, Click } = require("../models")
const { STATUS } = require("../constants")
const {
  generateRandomString,
  convertToUnixTimestamp,
  compareUnixTimestamp,
  compareHash,
  hash,
  isURLSafe,
  appendHttps
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
    const randomString = generateRandomString(5)
    const link = await Link.findOne({
      where: {
        path: randomString
      },
      attributes: ["path"]
    })
    if (link) {
      // if link is exist, generate new random string
      return LinkController.generateRandomUrl()
    } else {
      return randomString
    }
  }

  static async CreateLink(req, res, next) {
    try {
      const { url, description, expiredAt, secretCode } = req.body
      const { source } = req.query || "web"
      const { userData } = req
      const status = STATUS.ACTIVE

      if (!url) throw { status: 400, message: "Original URL is required" }

      const isURLValid = await isURLSafe(url)

      if (!isURLValid) throw { status: 400, message: "URL is not safe" }

      const path = await LinkController.generateRandomPath()

      const newLink = await Link.create({
        url: appendHttps(url),
        path,
        description,
        expiredAt,
        secretCode,
        status,
        userId: userData.userId,
        source
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

      if (path !== existingData.path) {
        const isPathExist = await Link.findOne({
          where: {
            path
          },
          attributes: ["path"]
        })

        if (isPathExist) {
          throw { status: 400, message: "New path is already taken" }
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

      console.log(ipInfo, " | ipInfo");
      console.log(ipInfo.ip, " | ipInfo.ip");

      const geolite = await client.city(ipInfo.ip)
      country = geolite.country.names.en
      city = geolite.city.names.en
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
        attributes: ["linkId", "url", "expiredAt", "secretCode", "totalClick"]
      })

      if (!link) throw { status: 404, message: "Link is not found" }

      if (link.status === 0) throw { status: 410, message: "Link is inactive" }

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
      } else {
        LinkController.InsertClickData({
          link,
          userAgent,
          referrer,
          source,
          visitor,
          ipInfo
        })
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
