const express = require('express')
const app = express()
const dotenv = require('dotenv')
dotenv.config()
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const path = require('path')
require('express-async-errors')
const { initializeCron } = require('./scheduler/matchCompareScheduler')

// security packages
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')

// connect to db
const connectDB = require('./db/connect')

//routers
const authRouter = require('./routes/authRoutes')
const betsRouter = require('./routes/betsRoutes')

// middleware
const notFoundMiddleware = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')
const authenticateUser = require('./middleware/auth')

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use(express.json())
app.use(cookieParser())
app.use(helmet())
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https://api.openligadb.de'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: [
        "'self'",
        'data:',
        'https://i.imgur.com',
        'https://upload.wikimedia.org', // Allow images from Wikimedia
        'https://i.imgur.com', // Specific Imgur URL
      ],
    },
  })
)
app.use(mongoSanitize())

// only when ready to deploy
const directoryPath = path.join(__dirname, 'client', 'dist')
app.use(express.static(directoryPath))

app.get('*', (req, res) => {
  res.sendFile(path.join(directoryPath, 'index.html'))
})

app.use('/api/auth', authRouter)
app.use('/api/bets', betsRouter)

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)
// Initialize the cron scheduler job
initializeCron()

const port = process.env.PORT || 5050

const start = async () => {
  try {
    await connectDB(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`)
    })
  } catch (error) {
    console.log(error)
  }
}

start()
