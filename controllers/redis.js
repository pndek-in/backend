const redisClient = require("../config/redis")
const { Link, Click, User } = require("../models")

class RedisController {
  static async GetRedis(key) {
    const client = await redisClient
    const result = await client.get(key)
    return result
  }

  static async UpdateRedis(key) {
    let value
    switch (key) {
      case "totalUser":
        value = await User.count()
        break
      case "totalLink":
        value = await Link.count()
        break
      case "totalClick":
        value = await Click.count()
        break
      default:
        break
    }

    const client = await redisClient
    await client.set(key, value)
    console.log(`Set ${key} to ${value}`)
  }

  static async RefreshRedis(req, res, next) {
    try {
      await RedisController.UpdateRedis("totalUser")
      await RedisController.UpdateRedis("totalLink")
      await RedisController.UpdateRedis("totalClick")

      res.status(200).json({
        message: "Redis Updated"
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = RedisController
