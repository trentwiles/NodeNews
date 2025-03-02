const db = require("../pgbase");

async function main() {
    const x = await db.query("select NOW()", [])
    console.log(x)
    return x
}

async function createUsers() {
    await db.init()
    const users = [
        ['james', 'admin123', 'A'],
        ['martha', 'iloveyou', 'U'],
        ['frank', 'password123', 'U']
        ['crontab_bot', 'nAUWnf39@^^fnllajhfbbmaiso', 'B']
    ]

    for(var i = 0; i < users.length; i++) {
        await db.query(`INSERT INTO users(username, password, permissions, joinTime, lastAccessedTime) 
                        VALUES($1, $2, $3, $4, $5)`, [...users[i], Math.floor(Date.now()/1000), 0])
    }
}

async function createEmails() {
    await db.init();
    const emails = [
        ["me@trentwil.es", 938],
        ["abuse@trentwil.es", 192],
        ["wiles.t@northeastern.edu", 1029]
    ]

    for(var i = 0; i < emails.length; i++) {
        await db.query(`INSERT INTO eml(email, ts) VALUES($1, $2)`, [...emails[i]])
    }
}

createEmails();