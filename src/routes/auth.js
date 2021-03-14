const express = require('express')
const router = express.Router()
const User = require('../models/user')

router.post('/register', async function (request, response) {
  const { email } = request.body

  try {
    if (await User.findOne({ email })) {
      return response.status(400).json({
        message: 'User already exists',
      })
    }

    const user = await User.create(request.body)
    user.password = undefined

    return response.status(200).json({ user })
  } catch (e) {
    return response.status(400).send({ error: e.message })
  }
})

module.exports = router
