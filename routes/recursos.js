const express = require('express')
const router = express.Router()
const pool = require('../utils/mysqlClient')

//Obtener 4 últimos recursos
router.get('/getLastRecursos', async (req, res) => {
  try {
    const query = `SELECT *
                   FROM recursos
                   ORDER BY id DESC LIMIT 4`
    const [result] = await pool.query(query)
    res.status(200).json({ error: false, recursos: result })
  } catch (error) {
    console.error('Error al obtener los últimos recursos:', error)
    res.status(200).json({ error: true, message: 'Error al obtener los últimos recursos' })
  }
})

// Obtener recursos filtrados y terapeutas por provincia
router.post('/getRecursosFiltrados', async (req, res) => {
  const { edad, inquietudes, provinciaCode } = req.body

  let rangoEdad = []
  try {
    if (edad >= 1 && edad <= 6) {
      rangoEdad = [1, 2]
    } else if (edad >= 7 && edad <= 12) {
      rangoEdad = [1, 3]
    } else if (edad >= 13 && edad <= 18) {
      rangoEdad = [1, 4]
    } else {
      rangoEdad = [1]
    }

    // Construir la consulta SQL para los recursos
    const recursosQuery = 'SELECT * FROM recursos WHERE idEdad IN (?) AND idTag IN (?)'
    const [recursosResult] = await pool.query(recursosQuery, [rangoEdad, inquietudes])

    // Construir la consulta SQL para los terapeutas
    const terapeutasQuery = 'SELECT * FROM terapeuta WHERE provinciaCode = ?'
    const [terapeutasResult] = await pool.query(terapeutasQuery, [provinciaCode])

    let message = ''
    if (terapeutasResult.length === 0) {
      message = `No hay terapeutas en ${provinciaCode} en nuestra base de datos`
    }

    res.status(200).json({
      error: false,
      recursos: recursosResult,
      terapeutas: terapeutasResult,
      message,
    })
  } catch (error) {
    console.error('Error al obtener los recursos y terapeutas filtrados:', error)
    res.status(200).json({
      error: true,
      message: 'Error al obtener los recursos y terapeutas filtrados',
    })
  }
})

//Obtener un recurso por su ID
router.post('/:id', async (req, res) => {
  const { idRecurso } = req.body
  try {
    const qRecurso = `SELECT *
                      FROM recursos
                      WHERE id = ?`
    const [recursoResult] = await pool.query(qRecurso, [idRecurso])

    if (recursoResult.length === 0) {
      return res.status(200).json({ error: true, message: 'Recurso no encontrado' })
    }

    res.status(200).json({ error: false, recurso: recursoResult[0] })
  } catch (error) {
    console.error('Error al obtener el recurso:', error)
    res.status(200).json({ error: true, message: 'Error al obtener el recurso' })
  }
})

module.exports = router
