const path = require('path')
const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
})

transport.use(
  'compile',
  hbs({
    viewEngine: {
      defaultLayout: false,
    },
    viewPath: path.resolve('./src/views/mail/'),
    extName: '.html',
  })
)

module.exports = transport
