const express = require('express')
const router = express.Router()

const authMiddleware = require('../middlewares/auth')

router.use(authMiddleware)

router.get('/', function (request, response) {
  response.json({ succes: true })
})

module.exports = router
