const db = require('./dbase')

var emails = await db.selectAll()

console.log(emails)

emails.forEach(element => {
    console.log(element)
});