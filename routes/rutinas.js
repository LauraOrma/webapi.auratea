const express = require('express')
const router = express.Router()
const pool = require('../utils/mysqlClient')

//Obtener rutinas del usuario
router.post('/getRutinasUsuario', async (req, res) => {
  const data = req.body
  let error = false
  // Consulta de selección cabera rutina
  const qRutina = `SELECT T0.id, T0.nombre
                   FROM rutina T0
                   WHERE idUsuario = ?;`

  // Consulta selección líneas de rutina
  const qPicto = `SELECT T0.idPictograma, T0.texto, T0.imagen
                  FROM rutinaPic T0
                           INNER JOIN rutina T1 ON T0.idRutina = T1.id
                  WHERE idUsuario = ?`

  // Obtención de resultados de cabecera y líneas
  const [rRutina, rPicto] = await Promise.all([
    pool.query(qRutina, [data?.idUsuario]),
    pool.query(qPicto, [data?.idUsuario]),
  ])

  // Envío a front de resultados.
  res.status(200).send({
    error,
    notFound: !rRutina?.length > 0 || true,
    rutinas: rRutina?.length > 0 ? rRutina[0] : [],
    pictos: rPicto?.length > 0 ? rPicto[0] : [],
  })
})

//Insertar una rutina en la base de datos
router.post('/insertRutina', async (req, res) => {
  const data = req.body

  // Consulta de inserción de cabecera rutina
  const qInsertRutina = `INSERT INTO rutina (nombre, idUsuario)
                         VALUES (?, ?);`

  // Consulta de inserción de líneas rutinas (pictogramas)
  const qInsertPictos = `INSERT INTO rutinaPic (idRutina, idPictograma, texto, imagen)
                         VALUES (?, ?, ?, ?);`

  try {
    // Iniciar una transacción
    await pool.query('BEGIN')

    // Insertar la rutina
    const [result] = await pool.query(qInsertRutina, [data.nombreRutina, data.idUsuario])
    const idRutina = result.insertId

    // Insertar los pictogramas asociados a la rutina
    for (const picto of data.pictos) {
      await pool.query(qInsertPictos, [idRutina, picto.id, picto.text, picto.imageUrl])
    }

    // Confirmar la transacción
    await pool.query('COMMIT')
    res.status(200).json({ error: false })

  } catch (error) {
    // Revertir la transacción en caso de error
    await pool.query('ROLLBACK')
    console.error(error)
    res.status(200).json({ error: true, message: 'Error al insertar rutina' })
  }
})

//Obtener una rutina por id
router.post('/:id', async (req, res) => {
  const data = req.body
  const { idUsuario, idRutina } = data
  const qRutina = `SELECT T0.id, T0.nombre
                   FROM rutina T0
                   WHERE T0.idUsuario = ?
                     AND T0.id = ?;`

  const qPicto = `SELECT T0.idPictograma, T0.texto, T0.imagen
                  FROM rutinaPic T0
                           INNER JOIN rutina T1 ON T0.idRutina = T1.id
                  WHERE T1.idUsuario = ?
                    AND T1.id = ?;`

  // Obtención de resultados de cabecera y líneas
  const [rRutina, rPicto] = await Promise.all([
    pool.query(qRutina, [idUsuario, idRutina]),
    pool.query(qPicto, [idUsuario, idRutina]),
  ])

  // Envío a front de resultados.
  res.status(200).send({
    notFound: !rRutina?.length > 0 || true,
    rutina: rRutina?.length > 0 ? rRutina[0] : [],
    pictos: rPicto?.length > 0 ? rPicto[0] : [],
  })
})

// Eliminar una rutina
router.delete('/deleteRutina', async (req, res) => {
  const data = req.body
  const { idUsuario, idRutina } = data

  const qDeleteRutina = `DELETE
                         FROM rutina
                         WHERE id = ?
                           AND idUsuario = ?;`

  try {
    await pool.query('BEGIN')

    // Eliminar la rutina
    await pool.query(qDeleteRutina, [idRutina, idUsuario])

    await pool.query('COMMIT')
    res.status(200).json({ error: false, message: 'Rutina eliminada correctamente' })

  } catch (error) {
    await pool.query('ROLLBACK')
    console.error(error)
    res.status(200).json({ error: true, message: 'Error al eliminar la rutina' })
  }
})

module.exports = router
