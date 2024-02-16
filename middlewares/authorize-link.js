"use strict"
const { Link } = require("../models")

const authorizeLink = async (req, res, next) => {
  try {
    const { userData, params } = req
    const { id } = params
    const link = await Link.findByPk(id)
    if (!link) {
      throw { status: 404, message: "Link not found" }
    }

    if (link.userId !== userData.userId) {
      throw { status: 401, message: "Unauthorized" }
    }

    req.urlData = link
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = authorizeLink
