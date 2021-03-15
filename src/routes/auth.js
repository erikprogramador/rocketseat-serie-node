const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const router = express.Router()

const User = require('../models/user')
const authConfig = require('../config/auth.json')
const authMiddleware = require('../middlewares/auth')

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  })
}

router.post('/register', async function (request, response) {
  const { email } = request.body

  try {
    if (await User.findOne({ email })) {
      return response.status(422).json({
        message: 'User already exists',
      })
    }

    const user = await User.create(request.body)
    user.password = undefined

    return response.status(200).json({ token: generateToken({ sub: user.id }) })
  } catch (e) {
    return response.status(400).send({ error: e.message })
  }
})

router.post('/authenticate', async function (request, response) {
  const { email, password } = request.body

  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    return response.status(404).json({
      message: 'User not found',
    })
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return response.status(400).json({
      message: 'Unauthorized! Invalid authentication params!',
    })
  }

  return response.status(200).json({
    token: generateToken({ sub: user.id }),
  })
})

router.get('/me', authMiddleware, async function (request, response) {
  const user = await User.findOne({ _id: request.userId })
  if (!user) {
    return response.status(404).json({
      message: 'User not found!',
    })
  }

  return response.status(200).json({
    user,
  })
})

module.exports = router
