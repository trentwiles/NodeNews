const pg = require('pg')
const { Client } = pg
const dotenv = require('dotenv')

dotenv.config({ path: './.env'})

const client = new Client({
    user: process.env.POSTGRES_USERNAME,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
});

client.connect()
    .then( (result) => {
        console.log("OK! -> " + result)
    })

async function init(){
    await client.query('CREATE TABLE IF NOT EXISTS eml (email VARCHAR(255) PRIMARY KEY, ts INTEGER)')
    await client.query('CREATE TABLE IF NOT EXISTS tokens (tkn VARCHAR(255) PRIMARY KEY, ts INTEGER)')
}

async function insertEmail(email){
    const insertText = 'INSERT INTO eml(email, ts) VALUES($1, $2)';
    const res = await client.query(insertText, [email, Math.floor(Date.now()/1000)]);
}

async function insertToken(token){
    const insertText = 'INSERT INTO tokens(tkn, ts) VALUES($1, $2)';
    const res = await client.query(insertText, [token, Math.floor(Date.now()/1000)]);
}

/* TODO: fix this function so it returns data */
async function selectAll(){
    const res = await client.query("SELECT email FROM eml");
    return res.rows
}


async function wipeEmails(){
    await client.query("DELETE FROM eml WHERE 0=0");
}

async function wipeTokens(){
    await client.query("DELETE FROM tokens WHERE 0=0");
}

async function deleteCertainToken(token){

    const insertText = 'DELETE FROM tokens WHERE tkn=$1';
    await client.query(insertText, [token]);
}

async function clearExpiredTokens(){
    // by default this will clear tokens older than 24 hours
    const db = new sqlite3.Database('db.db')
    const hoursAgo = Math.floor(Date.now()/1000) - (24 * 60 * 60)


    const insertText = 'DELETE FROM tokens WHERE ts <= $1';
    await client.query(insertText, [token]);
}

async function terminateConnection() {
    await client.end()
}

module.exports = {
    init,
    insertEmail,
    selectAll,
    wipeEmails,
    insertToken,
    wipeTokens,
    deleteCertainToken,
    clearExpiredTokens,
    terminateConnection
}