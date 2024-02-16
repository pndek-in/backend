const sortObjectByValue = (obj, order = "desc") => {
  return Object.keys(obj)
    .sort((a, b) => {
      if (order === "asc") {
        return obj[a] - obj[b]
      } else {
        return obj[b] - obj[a]
      }
    })
    .reduce((a, v) => {
      a[v] = obj[v]
      return a
    }, {})
}

module.exports = {
  sortObjectByValue
}
