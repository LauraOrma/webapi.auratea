require('dotenv').config()
const mysql = require('mysql2')

const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
}

/**
 * Pool de conexiones a la base de datos.
 */
const pool = mysql.createPool(mysqlConfig).promise()

const executeQuery = async (query, params) => {
  let rows = [], error = false
  await pool.query(query, params)
      .then(([result, fields]) => {
        console.log({ result: result })
        resultado = result
      })
      .catch(err => {
        console.log({ err })
        console.error('Error executing query', err)
      })
  return { error, rows }
}

module.exports = pool
