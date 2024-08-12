const sqlite3 = require('sqlite3').verbose()
// db.db will be gitignored


function init(){
    const db = new sqlite3.Database('db.db')
    db.serialize(() => {
        db.run("CREATE TABLE IF NOT EXISTS eml (email TEXT, ts INTEGER)");
    })
    db.serialize(() => {
        console.log('d')
        db.run("CREATE TABLE IF NOT EXISTS tokens (tkn TEXT, ts INTEGER)");
    })
    db.close();
    //return true
    //
}

function insertEmail(email){
    const db = new sqlite3.Database('db.db')
    db.serialize(() => {
        var ts = Math.floor(Date.now()/1000)
        const stmt = db.prepare("INSERT INTO eml VALUES (?, ?)");
        stmt.run(email, ts);
        stmt.finalize();
        
    })
    db.close()
    //return true
}

function insertToken(token){
    const db = new sqlite3.Database('db.db')
    db.serialize(() => {
        var ts = Math.floor(Date.now()/1000)
        const stmt = db.prepare("INSERT INTO tokens VALUES (?, ?)");
        stmt.run(token, ts);
        stmt.finalize();
        
    })
    db.close()
}


function getDBObject(){
    return new sqlite3.Database('db.db')
}

async function selectAll(){
    const db = new sqlite3.Database('db.db')
    var emails = []
    db.serialize(() => {
        db.each("SELECT email from eml", (err, row) => {
            emails.push(row.email)
            console.log(row.email)
        }, () => {
            db.close();
            return emails
        });
    })
}

function wipeEmails(){
    const db = new sqlite3.Database('db.db')
    db.serialize(() => {
        const stmt = db.prepare("DELETE FROM eml WHERE 0=0");
        stmt.run();
    }, () => {
        db.close();
        return true
    });
}

function wipeTokens(){
    const db = new sqlite3.Database('db.db')
    db.serialize(() => {
        const stmt = db.prepare("DELETE FROM tokens WHERE 0=0");
        stmt.run();
    }, () => {
        db.close();
        return true
    });
}

function deleteCertainToken(token){
    const db = new sqlite3.Database('db.db')
    db.serialize(() => {
        const stmt = db.prepare("DELETE FROM tokens WHERE tkn=?");
        stmt.run(token);
    }, () => {
        db.close();
        return true
    });
}

function clearExpiredTokens(){
    // by default this will clear tokens older than 24 hours
    const db = new sqlite3.Database('db.db')
    const hoursAgo = Math.floor(Date.now()/1000) - (24 * 60 * 60)

    db.serialize(() => {
        const stmt = db.prepare("DELETE FROM tokens WHERE ts =< ?");
        stmt.run(token);
    }, () => {
        db.close();
        console.log("Deleted all tokens created before " + hoursAgo)
        return true
    });
}

module.exports = {
    init,
    insertEmail,
    selectAll,
    wipeEmails,
    getDBObject,
    insertToken,
    wipeTokens,
    deleteCertainToken,
    clearExpiredTokens
}