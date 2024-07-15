const sqlite3 = require('sqlite3').verbose()
// db.db will be gitignored
const db = new sqlite3.Database('db.db')

function init(){
    db.serialize(() => {
        db.run("CREATE TABLE IF NOT EXISTS eml (email TEXT, ts INTEGER)");
        db.close();
    })
    return true
}

function insertEmail(email){
    db.serialize(() => {
        var ts = Math.floor(Date.now()/1000)
        const stmt = db.prepare("INSERT INTO eml VALUES (?, ?)");
        stmt.run(email, ts);
        stmt.finalize();
        db.close()
    })
    return true
}

function selectAll(){
    var emails = []
    db.serialize(() => {
        db.each("SELECT email from eml", (err, row) => {
            emails.push(row.email)
        });
        db.close()
    })
    return emails
}

function wipeEmails(){
    db.serialize(() => {
        const stmt = db.prepare("DELETE FROM eml WHERE 0=0");
        stmt.run();
        db.close()
    })
    return true
}

module.exports = {
    init,
    insertEmail,
    selectAll,
    wipeEmails
}