const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnAuthenticatedError } = require('../errors/index')
const attachCookies = require('../utils/attachCookies')

exports.register = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    throw new BadRequestError('please provide all values')
  }
  const userAlreadyExists = await User.findOne({ email })
  if (userAlreadyExists) {
    throw new BadRequestError('Email already in use')
  }
  const user = await User.create({ name, email, password })

  const token = user.createJWT()
  attachCookies({ res, token })
  res.status(StatusCodes.CREATED).json({
    user: {
      email: user.email,
      name: user.name,
      location: user.location,
      team: user.team,
    },
  })
}

exports.login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    throw new BadRequestError('Please provide all values')
  }
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new UnAuthenticatedError('Invalid Credentials')
  }

  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    throw new UnAuthenticatedError('Invalid Credentials')
  }
  const token = user.createJWT()
  user.password = undefined
  attachCookies({ res, token })

  res.status(StatusCodes.OK).json({ user })
}

exports.updateUser = async (req, res) => {
  const { email, name, location, team } = req.body
  if (!email || !name || !location || !team) {
    throw new BadRequestError('Please provide all values')
  }
  const user = await User.findOne({ _id: req.user.userId })

  user.email = email
  user.name = name
  user.location = location
  user.team = team

  await user.save()

  const token = user.createJWT()
  attachCookies({ res, token })

  res.status(StatusCodes.OK).json({ user })
}

exports.getCurrentUser = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId })
  res.status(StatusCodes.OK).json({ user })
}

exports.getAllUsers = async (req, res) => {
  const users = await User.find()
  res.status(StatusCodes.OK).json({ users })
}

exports.logout = async (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  })
  res.status(StatusCodes.OK).json({ msg: 'user logged out' })
}
