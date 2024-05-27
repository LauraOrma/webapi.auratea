require('dotenv').config()
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const pool = require('../utils/mysqlClient')

// Endpoint de inicio de sesión
router.post('/login', async (req, res) => {
  const data = req.body
  let error = false
  // Consulta obtención de usuarios coincidentes
  const q = `SELECT T0.id, T0.nombre, T0.email, T0.pass, T0.fNacimiento
             FROM usuario T0
             WHERE T0.email = ?;`
  // Obtención de datos
  let user = await new Promise(async (resolve) => {
    const [results] = await pool.query(q, [data?.email])
        .then(([results, fields]) => {
          return [results, fields]
        }).catch(err => {
          error = true
          console.error(`Error al obtener datos de usuario `, err)
          return []
        })

    // Verificación de obtención de datos
    if (results?.length > 0) {
      // Comparación de contraseña del usuario web y almacenada en base de datos
      if (await bcrypt.compare(data.pass, results[0].pass)) {
        // En caso de coincidencia se devuelve el objeto con los datos del usuario
        resolve({
          id: results[0].id,
          name: results[0].nombre,
          email: results[0].email,
          fNacimiento: results[0].fNacimiento,
        })
      } else {
        // En caso de no coincidencia no se devuelven datos.
        resolve(undefined)
      }
    } else {
      // En caso de error no se devuelven datos
      resolve(undefined)
    }
  })

  if (user !== undefined) {
    // En caso de existir el usuario se genera el token que se devolverá al usuario como parte del login correcto.
    let token = jwt.sign(user, process.env.JWTTOKEN)
    res.status(200).json({
      error: false,
      token: token,
      User: user,
    })
  } else {
    // Se devuelve al usuario un error de autenticación sin dar más pistas del motivo por seguridad.
    res.status(200).json({ error: true })
  }
})

// Endpoint de registro de usuario
router.post('/registro', async (req, res) => {
  const data = req.body
  const { nombre, email, pass, fNacimiento } = data
  let error = false
  // Consulta de inserción de usuario
  const q = `INSERT INTO usuario (nombre, email, pass, fNacimiento)
             VALUES (?, ?, ?, ?);`
  // Encriptación de contraseña
  const hashedPass = await bcrypt.hash(pass, 12)
  // Inserción de datos
  await pool.query(q, [nombre, email, hashedPass, fNacimiento])
      .then(([results, fields]) => {
        if (results.affectedRows > 0) {
          error = false
          console.log('Usuario registrado correctamente')
        } else {
          console.log('Error al registrar usuario')
        }
        error = true
      }).catch(err => {
        error = true
        console.error(`Error al registrar usuario `, err)
      })

  res.status(200).json({ error })
})

module.exports = router
