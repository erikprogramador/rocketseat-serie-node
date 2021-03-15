const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const mailer = require('../services/mailer')
const router = express.Router()

const User = require('../models/user')
const authMiddleware = require('../middlewares/auth')

function generateToken(params = {}) {
  return jwt.sign(params, process.env.APP_KEY, {
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

router.post('/forgot-password', async function (request, response) {
  const { email } = request.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return response.status(404).json({
        message: 'User not found',
      })
    }
    const token = crypto.randomBytes(20).toString('hex')
    const now = new Date()
    now.setHours(now.getHours() + 1)
    await User.findByIdAndUpdate(user.id, {
      $set: {
        passwordResetToken: token,
        passwordResetExpires: now,
      },
    })

    mailer.sendMail(
      {
        to: email,
        from: process.env.MAIL_FROM,
        template: 'auth/forgot_password',
        context: { token },
      },
      error => {
        if (error) {
          console.log(error)
          return response
            .status(400)
            .json({ message: 'Cannot send forgot password e-mail' })
        }

        return response.status(200).json({
          message: 'A e-mail was sent with your reset token! Verify your inbox',
        })
      }
    )
  } catch (error) {
    return response.status(400).json({
      message: error.message,
    })
  }
})

router.post('/reset-password', async function (request, response) {
  const { email, token, password } = request.body

  try {
    const user = await User.findOne({ email }).select(
      '+passwordResetToken passwordResetExpires'
    )
    if (!user) {
      return response.status(404).json({
        message: 'User not found',
      })
    }

    if (token !== user.passwordResetToken) {
      return response.status(400).json({ message: 'Invalid token' })
    }

    const now = new Date()
    if (now > user.passwordResetExpires) {
      return response
        .status(400)
        .json({ message: 'Token expired! Generate a new token' })
    }
    user.password = password
    await user.save()

    return response.status(200).json({ message: 'New password set!' })
  } catch (error) {
    return response.status(400).json({ message: error.message })
  }
})

module.exports = router
