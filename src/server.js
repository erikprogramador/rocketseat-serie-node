const express = require('express')
const authRoutes = require('./routes/auth')

const app = express()
app.use(express.json())
app.use('/auth', authRoutes)

app.get('/', (request, response) => {
  response.send('Success!')
})

app.listen(3000)
