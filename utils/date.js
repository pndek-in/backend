"use strict"
const convertToUnixTimestamp = (date) => {
  return Math.floor(new Date(date).getTime() / 1000)
}

const compareUnixTimestamp = (date1, date2) => {
  if (date1 > date2) {
    return 1
  } else if (date1 < date2) {
    return -1
  } else {
    return 0
  }
}

module.exports = {
  convertToUnixTimestamp,
  compareUnixTimestamp
}
