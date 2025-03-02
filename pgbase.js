const pg = require('pg')
const { Client } = pg
const dotenv = require('dotenv')

dotenv.config()

const client = new Client({
    user: process.env.POSTGRES_USERNAME,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
});

async function init(){
    await client.connect()

    await client.query('CREATE TABLE IF NOT EXISTS eml (email VARCHAR(255), ts INTEGER)')
    await client.query('CREATE TABLE IF NOT EXISTS tokens (tkn VARCHAR(255), ts INTEGER)')

    await client.end();
}

async function insertEmail(email){
    await client.connect()

    const insertText = 'INSERT INTO eml(email, ts) VALUES($1, $2)';
    const res = await client.query(insertText, [email, Math.floor(Date.now()/1000)]);

    await client.end()
}

async function insertToken(token){
    await client.connect()

    const insertText = 'INSERT INTO tokens(tkn, ts) VALUES($1, $2)';
    const res = await client.query(insertText, [token, Math.floor(Date.now()/1000)]);

    await client.end()
}


async function selectAll(){
    await client.connect()

    const res = await client.query("SELECT eml FROM email", (email, ts) => { /* inside of this function we can handle the data */});
}