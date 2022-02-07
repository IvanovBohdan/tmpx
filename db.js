const Pool = require('pg').Pool
const config = require('./config.js')

const pool = new Pool(config.db)

module.exports = pool