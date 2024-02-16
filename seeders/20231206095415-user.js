"use strict"
const { convertToUnixTimestamp, hash } = require("../utils")

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date()
    await queryInterface.bulkInsert(
      "Users",
      [
        {
          email: "test@mail.com",
          password: await hash("admin123"),
          name: "admin",
          createdAt: convertToUnixTimestamp(now),
          updatedAt: convertToUnixTimestamp(now),
          isVerified: true
        }
      ],
      {}
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {})
  }
}
