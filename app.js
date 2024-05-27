require('dotenv').config()
const express = require('express')
const path = require('path')
const logger = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const jwt = require('jsonwebtoken')

const indexRouter = require('./routes/index')
const rutinasRouter = require('./routes/rutinas')
const recursosRouter = require('./routes/recursos')

let corsConfig
if (process.env.ENV === 'dev') {
  corsConfig = {
    origin: [
      'http://localhost:3039',
    ],
  }
} else {
  corsConfig = {
    origin: [
      'https://lauortega.es',
    ],
  }
}

// App configuration
const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors(corsConfig))
app.use(helmet({
  crossOriginEmbedderPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// Mapping de carpetas
app.use(express.static(path.join(__dirname, 'public')))

// Middlewares
// Validación de token enviado
const parseToken = express.Router()
parseToken.use((req, res, next) => {
  let token = req.headers['authorization'] || req.headers['access-token']
  token = token?.replace('Bearer ', '')
  if (token === 'undefined') token = undefined
  if (token) {
    jwt.verify(token, process.env.JWTTOKEN, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token no valido' })
      } else {
        req.decodedToken = decoded
        next()
      }
    })
  } else {
    req.decodedToken = undefined
    next()
  }
})

// Requerimiento token obligatorio
const rutasProtegidas = express.Router()
rutasProtegidas.use((req, res, next) => {
  if (req.decodedToken)
    next()
  else
    res.status(401).send({ error: 'Acceso no autorizado' })
})

// Rutas
app.use('/api', indexRouter)
app.use('/api/rutina', rutinasRouter)
app.use('/api/recursos', recursosRouter)

app.use(function(err, req, res, next) {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // Renderizar la página de error
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
