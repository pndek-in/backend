"use strict"
const { Model } = require("sequelize")
const { convertToUnixTimestamp, hash } = require("../utils")

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Link, {
        foreignKey: "userId"
      })
    }
  }
  User.init(
    {
      userId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      email: DataTypes.STRING,
      name: DataTypes.STRING,
      password: DataTypes.STRING,
      createdAt: DataTypes.INTEGER,
      updatedAt: DataTypes.INTEGER,
      isVerified: DataTypes.BOOLEAN
    },
    {
      sequelize,
      modelName: "User",
      createdAt: "createdAt",
      updatedAt: "updatedAt"
    }
  )

  User.beforeCreate(async (record, options) => {
    const now = new Date()
    record.dataValues.createdAt = convertToUnixTimestamp(now)
    record.dataValues.updatedAt = convertToUnixTimestamp(now)

    const hashedPassword = await hash(record.dataValues.password)
    record.dataValues.password = hashedPassword
  })

  User.beforeBulkUpdate((record, options) => {
    const now = new Date()
    record.attributes.updatedAt = convertToUnixTimestamp(now)
  })

  return User
}
