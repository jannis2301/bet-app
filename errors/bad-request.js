const { StatusCodes } = require('http-status-codes')
const CustomAPIError = require('./custom-api')

module.exports = class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message)
    this.statusCode = StatusCodes.BAD_REQUEST
  }
}
