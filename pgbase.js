const pg = require('pg');
const { Client } = pg;
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const client = new Client({
    user: process.env.POSTGRES_USERNAME,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
});

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to PostgreSQL");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
}

async function init() {
    await client.query('CREATE TABLE IF NOT EXISTS eml (email VARCHAR(255) PRIMARY KEY, ts INTEGER)');
    await client.query('CREATE TABLE IF NOT EXISTS tokens (tkn VARCHAR(255) PRIMARY KEY, ts INTEGER)');
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
    return res.rows; // ✅ Return fetched rows
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
    if (!client._ending) {
        await client.end();
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
    connectDB, // ✅ Added to ensure connection is established before calling other functions
    init,
    insertEmail,
    selectAll,
    wipeEmails,
    insertToken,
    wipeTokens,
    deleteCertainToken,
    clearExpiredTokens,
    closeConnection
};
