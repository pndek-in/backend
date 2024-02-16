"use strict"
const { Model } = require("sequelize")
const { convertToUnixTimestamp, hash } = require("../utils")

module.exports = (sequelize, DataTypes) => {
  class Link extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Link.belongsTo(models.User, {
        foreignKey: "userId"
      })
      Link.hasMany(models.Click, {
        foreignKey: "linkId"
      })
    }
  }
  Link.init(
    {
      linkId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      path: DataTypes.STRING,
      url: DataTypes.STRING,
      description: DataTypes.STRING,
      source: DataTypes.STRING,
      status: DataTypes.INTEGER,
      expiredAt: DataTypes.INTEGER,
      secretCode: DataTypes.STRING,
      userId: DataTypes.INTEGER,
      totalClick: DataTypes.INTEGER,
      createdAt: DataTypes.INTEGER,
      updatedAt: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: "Link",
      createdAt: "createdAt",
      updatedAt: "updatedAt"
    }
  )

  Link.beforeCreate(async (record, options) => {
    const now = new Date()
    record.dataValues.createdAt = convertToUnixTimestamp(now)
    record.dataValues.updatedAt = convertToUnixTimestamp(now)
    record.dataValues.totalClick = 0

    if (record.dataValues.secretCode) {
      const hashedSecretCode = await hash(record.dataValues.secretCode)
      record.dataValues.secretCode = hashedSecretCode
    }
  })

  Link.beforeBulkUpdate((record, options) => {
    const now = new Date()
    record.attributes.updatedAt = convertToUnixTimestamp(now)
  })

  return Link
}
