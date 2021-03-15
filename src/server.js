const express = require('express')
const authRoutes = require('./routes/auth')
const projectsRoutes = require('./routes/projects')

const app = express()
app.use(express.json())
app.use('/auth', authRoutes)
app.use('/projects', projectsRoutes)

app.get('/', (request, response) => {
  response.send('Success!')
})

app.listen(3000)
