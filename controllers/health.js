const { sequelize } = require("../models")

class HealthController {
  static async Check(req, res, next) {
    try {
      await sequelize.query("SELECT 1")

      res.status(200).json({
        status: "ok"
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = HealthController
