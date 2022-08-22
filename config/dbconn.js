require('dotenv').config();
const { createConnection } = require('mysql');

// create connection variable
let connection;
// create function to allow connection
(function handleConnection() {
    connection = createConnection({
        host: process.env.host,
        database: process.env.database,
        user: process.env.dbUser,
        port: process.env.dbPort,
        password: process.env.dbPassword,
        multipleStatements: true
    });
    // error controll...if data not found send error
    connection.on('error', (err)=> {
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            handleConnection();
        }else {
            throw err;
        }
    }) 
})();

module.exports = connection;