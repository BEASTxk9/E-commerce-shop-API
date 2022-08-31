require('dotenv').config();
const { createPool } = require('mysql');
const connection = createPool({
    host: process.env.host,
    database: process.env.database,
    user: process.env.dbUser,
    port: process.env.dbPort,
    password: process.env.dbPassword,
    multipleStatements: true,
    connectionLimit: 10
});

module.exports = connection;