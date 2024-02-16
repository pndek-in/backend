"use strict"
const { Model } = require("sequelize")
const { convertToUnixTimestamp } = require("../utils")

module.exports = (sequelize, DataTypes) => {
  class Click extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Click.belongsTo(models.Link, {
        foreignKey: "linkId"
      })
    }
  }
  Click.init(
    {
      clickId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      linkId: DataTypes.INTEGER,
      clickedAt: DataTypes.BIGINT,
      userAgent: DataTypes.STRING,
      referrer: DataTypes.STRING,
      source: DataTypes.STRING,
      visitor: DataTypes.STRING,
      city: DataTypes.STRING,
      country: DataTypes.STRING
    },
    {
      sequelize,
      modelName: "Click",
      timestamps: false
    }
  )

  Click.beforeCreate(async (record, options) => {
    const now = new Date()
    record.dataValues.clickedAt = convertToUnixTimestamp(now)
  })

  return Click
}
