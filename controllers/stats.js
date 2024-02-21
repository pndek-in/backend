"use strict"
const { Op } = require("sequelize")
const dayjs = require("dayjs")
const parser = require("ua-parser-js")
const { Link, Click, User } = require("../models")
const { sortObjectByValue } = require("../utils")

class StatsController {
  static async GetHomeStats(req, res, next) {
    try {
      const totalUser = await User.count()
      const totalLink = await Link.count()
      const totalClick = await Click.count()

      res.status(200).json({
        message: "Stats is successfully retrieved",
        data: {
          totalUser,
          totalLink,
          totalClick
        }
      })
    } catch (error) {
      next(error)
    }
  }

  static AssignCountersStats({
    links,
    totalClicksAllTime,
    totalClicksPeriod,
    uniqueVisitor,
    qrCodeVisits,
    isUserStats,
    activeLink
  }) {
    const countersStats = []
    // Assign counters
    if (isUserStats) {
      countersStats.push(
        {
          title: "total-created-links",
          value: links.length
        },
        {
          title: "total-active-links",
          value: activeLink
        }
      )
    }

    countersStats.push(
      {
        title: "total-clicks-all-time",
        value: totalClicksAllTime
      },
      {
        title: "total-clicks-period",
        value: totalClicksPeriod
      },
      {
        title: "unique-visitors",
        value: Object.keys(uniqueVisitor).length
      },
      {
        title: "qr-code-visits",
        value: qrCodeVisits
      }
    )

    return countersStats
  }

  static AssignChartStats({ chartData, start, end }) {
    const chartStats = {
      labels: [],
      data: []
    }

    const startDate = dayjs.unix(start)
    const endDate = dayjs.unix(end)
    const list = {}

    // make a list of dates from start to end
    let currentDate = startDate
    while (currentDate.isBefore(endDate)) {
      list[currentDate.format("YYYY-MM-DD")] = 0
      currentDate = currentDate.add(1, "day")
    }

    // merge the list with the chartData
    const mergedList = { ...list, ...chartData }

    Object.keys(mergedList).forEach((date) => {
      chartStats.labels.push(dayjs(date).format("DD MMM"))
      chartStats.data.push(chartData[date] || 0)
    })

    return chartStats
  }

  static AssignTablesStats({
    linkData,
    countryData,
    cityData,
    isUserStats,
    referrerData,
    browserData,
    deviceData,
    osData
  }) {
    const results = []
    const limit = 5

    if (isUserStats) {
      const sortedLinkData = sortObjectByValue(linkData)
      results.push({
        title: "most-clicked-links",
        column: "short-url",
        labels: Object.keys(sortedLinkData).slice(0, limit),
        values: Object.values(sortedLinkData).slice(0, limit)
      })
    }

    const sortedCountryData = sortObjectByValue(countryData)
    results.push({
      title: "clicks-by-country",
      column: "country",
      labels: Object.keys(sortedCountryData).slice(0, limit),
      values: Object.values(sortedCountryData).slice(0, limit)
    })

    const sortedCityData = sortObjectByValue(cityData)
    results.push({
      title: "clicks-by-city",
      column: "city",
      labels: Object.keys(sortedCityData).slice(0, limit),
      values: Object.values(sortedCityData).slice(0, limit)
    })

    const sortedReferrerData = sortObjectByValue(referrerData)
    results.push({
      title: "clicks-by-referrer",
      column: "referrer",
      labels: Object.keys(sortedReferrerData).slice(0, limit),
      values: Object.values(sortedReferrerData).slice(0, limit)
    })

    const sortedBrowserData = sortObjectByValue(browserData)
    results.push({
      title: "clicks-by-browser",
      column: "browser",
      labels: Object.keys(sortedBrowserData).slice(0, limit),
      values: Object.values(sortedBrowserData).slice(0, limit)
    })

    const sortedDeviceData = sortObjectByValue(deviceData)
    results.push({
      title: "clicks-by-device",
      column: "device",
      labels: Object.keys(sortedDeviceData).slice(0, limit),
      values: Object.values(sortedDeviceData).slice(0, limit)
    })

    const sortedOsData = sortObjectByValue(osData)
    results.push({
      title: "clicks-by-os",
      column: "os",
      labels: Object.keys(sortedOsData).slice(0, limit),
      values: Object.values(sortedOsData).slice(0, limit)
    })

    return results
  }

  static ParseLists({ links, start, end, isUserStats }) {
    // COUNTERS
    let totalClicksAllTime = 0
    let totalClicksPeriod = 0
    let uniqueVisitor = {}
    let qrCodeVisits = 0
    let activeLink = 0

    // CHART
    const chartData = {}

    // TABLES
    const linkData = {}
    const countryData = {}
    const cityData = {}
    const referrerData = {}
    const browserData = {}
    const deviceData = {}
    const osData = {}

    links.forEach((link) => {
      // Counting clicks
      totalClicksAllTime += link.totalClick
      totalClicksPeriod += link.Clicks.length

      // Counting Link Data
      if (link.Clicks.length > 0) {
        linkData[link.path] = link.Clicks.length
      }
      if (link.status === 1) {
        activeLink++
      }

      link.Clicks.forEach((click) => {
        // Counting unique visitor
        if (uniqueVisitor[click.visitor]) {
          uniqueVisitor[click.visitor]++
        } else {
          uniqueVisitor[click.visitor] = 1
        }

        // Counting QR code visits
        if (click.source === "qr") {
          qrCodeVisits++
        }

        // Counting Chart Data
        const date = dayjs.unix(click.clickedAt).format("YYYY-MM-DD")

        if (chartData[date]) {
          chartData[date]++
        } else {
          chartData[date] = 1
        }

        // Assigning Country Data
        if (click.country) {
          if (countryData[click.country]) {
            countryData[click.country]++
          } else {
            countryData[click.country] = 1
          }
        }

        // Assigning City Data
        if (click.city) {
          if (cityData[click.city]) {
            cityData[click.city]++
          } else {
            cityData[click.city] = 1
          }
        }

        // Assigning Referrer Data
        if (click.referrer) {
          if (referrerData[click.referrer]) {
            referrerData[click.referrer]++
          } else {
            referrerData[click.referrer] = 1
          }
        }

        // Assigning Device Data
        const { browser, device, os } = parser(click.userAgent)
        if (browser) {
          const browserName = browser.name || "N/A"
          if (browserData[browserName]) {
            browserData[browserName]++
          } else {
            browserData[browserName] = 1
          }
        }

        if (device) {
          const deviceType = device.type || "desktop"
          if (deviceData[deviceType]) {
            deviceData[deviceType]++
          } else {
            deviceData[deviceType] = 1
          }
        }
        
        if (os) {
          const osName = os.name || "N/A"
          if (osData[osName]) {
            osData[osName]++
          } else {
            osData[osName] = 1
          }
        }
      })
    })

    const result = {
      counters: [],
      chart: {},
      tables: []
    }

    result.counters = StatsController.AssignCountersStats({
      links,
      totalClicksAllTime,
      totalClicksPeriod,
      uniqueVisitor,
      qrCodeVisits,
      isUserStats,
      activeLink
    })

    result.chart = StatsController.AssignChartStats({ chartData, start, end })

    result.tables = StatsController.AssignTablesStats({
      countryData,
      cityData,
      linkData,
      isUserStats,
      referrerData,
      browserData,
      deviceData,
      osData
    })

    return result
  }

  static async GetUserStats(req, res, next) {
    try {
      const { start, end } = req.query
      const userData = req.userData

      const links = await Link.findAll({
        where: {
          userId: userData.userId
        },
        include: {
          model: Click,
          required: false,
          where: {
            clickedAt: {
              [Op.between]: [start, end]
            }
          }
        }
      })

      const result = StatsController.ParseLists({
        links,
        start,
        end,
        isUserStats: true
      })

      res.status(200).json({
        message: "Stats is successfully retrieved",
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  static async GetLinkStats(req, res, next) {
    try {
      const { start, end } = req.query
      const { id } = req.params

      const link = await Link.findOne({
        where: {
          linkId: id
        },
        include: {
          model: Click,
          required: false,
          where: {
            clickedAt: {
              [Op.between]: [start, end]
            }
          }
        }
      })

      const result = StatsController.ParseLists({
        links: [link],
        start,
        end,
        isUserStats: false
      })

      res.status(200).json({
        message: "Stats is successfully retrieved",
        data: {
          ...result,
          link: {
            path: link.path
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = StatsController
