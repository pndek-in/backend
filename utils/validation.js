const validateEmail = (email, key) => {
  const re = /\S+@\S+\.\S+/
  if (re.test(email)) return true
  throw { status: 400, message: `${key} is not valid email format` }
}

const validateNumber = (number, key) => {
  const re = /\d/
  if (re.test(number)) return true
  throw { status: 400, message: `${key} is not valid number format` }
}

module.exports = {
  validateEmail,
  validateNumber
}