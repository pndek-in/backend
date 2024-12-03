"use strict"
const isURLSafe = async (url) => {
  try {
    const googleAPIKey = process.env.GOOGLE_API_KEY
    const safeBrowsingUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${googleAPIKey}`
    const body = {
      client: {
        clientId: "pndekin",
        clientVersion: "1.0.0"
      },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION"
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }]
      }
    }

    const response = await fetch(safeBrowsingUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (data.matches) {
      throw { status: 400, message: "URL is not safe" }
    }
    return true
  } catch (error) {
    throw error
  }
}

const appendHttps = (url) => {
  if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
    url = "https://" + url
  }
  return url
}

const isURLValid = (url) => {
  const pattern = new RegExp(
    /^(ftp|http|https):\/\/[^\s/$.?#].[^\s]*$|^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}([/][^\s]*)?$/
  )

  return pattern.test(url)
}

module.exports = {
  isURLSafe,
  appendHttps,
  isURLValid
}
