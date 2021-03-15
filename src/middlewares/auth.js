const jwt = require('jsonwebtoken')

module.exports = function (request, response, next) {
  const authHeader = request.headers.authorization

  if (!authHeader) {
    return response.status(401).send({
      message: 'No token provided!',
    })
  }

  // Bearer
  const parts = authHeader.split(' ')

  if (parts.length !== 2) {
    return response.status(401).send({
      message: 'Invalid token!',
    })
  }

  const [scheme, token] = parts

  if (!/^Bearer$/i.test(scheme)) {
    return response.status(401).json({
      message: 'Token malformatted',
    })
  }

  jwt.verify(token, process.env.APP_KEY, (error, decoded) => {
    if (error) {
      return response.status(401).json({
        message: 'Invalid token',
      })
    }

    request.userId = decoded.sub
    return next()
  })
}
