const { StatusCodes } = require('http-status-codes')
const CustomAPIError = require('./custom-api')

module.exports = class UnAuthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message)
    this.statusCode = StatusCodes.UNAUTHORIZED
  }
}
