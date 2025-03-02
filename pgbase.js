const pg = require('pg');
const { Pool } = pg;
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const pool = new Pool({
    user: process.env.POSTGRES_USERNAME,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
});

async function connectDB() {
    try {
        await pool.connect();
        console.log("Connected to PostgreSQL");
    } 
    catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
}

async function init() {
    await query('CREATE TABLE IF NOT EXISTS eml (email VARCHAR(255) PRIMARY KEY, ts INTEGER)');
    await query('CREATE TABLE IF NOT EXISTS users (username VARCHAR(255) PRIMARY KEY, password VARCHAR(255) NOT NULL, permissions VARCHAR(1), joinTime INTEGER, lastAccessedTime INTEGER)');
    await query('CREATE TABLE IF NOT EXISTS tokens (tkn VARCHAR(255) PRIMARY KEY, username VARCHAR(255), ts INTEGER, FOREIGN KEY (username) REFERENCES users(username))');
    await query(`CREATE TABLE IF NOT EXISTS audit_log (
        action VARCHAR(255),
        ip_address VARCHAR(40),
        ts INTEGER,
        username VARCHAR(255),
        FOREIGN KEY (username) REFERENCES users(username)
    )`);
    
}

async function query(text, params) {
    let client;
    try {
        client = await pool.connect(); // Get a connection from the pool
        const result = await client.query(text, params); // Execute query
        return result.rows; // Return query results
    } catch (error) {
        console.error("Database query error:", error);
        throw error; // Rethrow the error for better debugging
    } finally {
        if (client) client.release(); // Always release the connection
    }
}

async function closeConnection() {
    if (!pool._ending) {
        await pool.end();
        console.log("Database connection closed");
    }
}

// when process is killed, terminate connection
process.on('exit', async () => {
    await closeConnection();
});

// unexpected exit handling
process.on('SIGINT', async () => { 
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => { 
    await closeConnection();
    process.exit(0);
});
// end unexpected exit handling

module.exports = {
    connectDB,
    init,
    query,
    closeConnection
};
