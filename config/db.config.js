const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'MoazAhmed@123', // Replace with your MySQL password if you have one
    database: 'sehetak_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Function to get the pool
const getPool = async () => {
    try {
// Test the connection
        const connection = await pool.getConnection();
        connection.release();
        return pool;
    } catch (err) {
        console.error('Error getting database connection:', err);
        throw err;
    }
};

// Test the connection on startup
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
    });

module.exports = { getPool }; 