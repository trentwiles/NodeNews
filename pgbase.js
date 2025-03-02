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
    await client.query('CREATE TABLE IF NOT EXISTS eml (email VARCHAR(255) PRIMARY KEY, ts INTEGER)');
    await client.query('CREATE TABLE IF NOT EXISTS tokens (tkn VARCHAR(255) PRIMARY KEY, ts INTEGER)');
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


async function insertEmail(email) {
    const insertText = 'INSERT INTO eml(email, ts) VALUES($1, $2)';
    await client.query(insertText, [email, Math.floor(Date.now() / 1000)]);
}

async function insertToken(token) {
    const insertText = 'INSERT INTO tokens(tkn, ts) VALUES($1, $2)';
    await client.query(insertText, [token, Math.floor(Date.now() / 1000)]);
}

async function selectAll() {
    const res = await client.query("SELECT email FROM eml");
    return res.rows;
}

async function selectAllTokens() {
    const res = await client.query("SELECT email FROM tokens");
    return res.rows;
}

async function validateToken(possibleToken) {
    const res = await client.query("SELECT 1 FROM tokens WHERE token=$1", [possibleToken]);
    return (res.rowCount > 0)
}

async function wipeEmails() {
    await client.query("DELETE FROM eml");
}

async function wipeTokens() {
    await client.query("DELETE FROM tokens");
}

async function deleteCertainToken(token) {
    const deleteText = 'DELETE FROM tokens WHERE tkn=$1';
    await client.query(deleteText, [token]);
}

async function clearExpiredTokens() {
    const hoursAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
    const deleteText = 'DELETE FROM tokens WHERE ts <= $1';
    await client.query(deleteText, [hoursAgo]); // Fixed variable name
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
    insertEmail,
    selectAll,
    wipeEmails,
    insertToken,
    wipeTokens,
    deleteCertainToken,
    clearExpiredTokens,
    selectAllTokens,
    validateToken,
    query,
    closeConnection
};
