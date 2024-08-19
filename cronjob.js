const newsletter = require('./letterBuilder')
const mail = require('./mailer')
const db = require('./dbase')

function sendEmailCron(){
    // When executed, this script will select all emails
    // from the database, the sends the newsletter to
    // said emails.

    const NL_DATA = newsletter.buildNewsletter()
    const NL_TITLE = NL_DATA["title"]
    const NL_HTML = NL_DATA["html"]
    const NL_TEXT = NL_DATA["raw"]
    //const NL_SENDER_NAME = NL_DATA["name"]
    // For now, sender name is just the title of the newsletter, to be changed in a future update

    const x = db.getDBObject()
    x.serialize(() => {
        x.each("SELECT email from eml", (err, row) => {
            mail.send(NL_TITLE, row.email, NL_TITLE, NL_TEXT, NL_HTML)
            console.log("Queued an email to " + row.email)
            // see comment on sender name on previous line
        });
        x.close()
    })
}
// db.selectAll()
//     .then(result => {
        
//         console.log(result); // Process the result
//         // Now do something else after getting the result
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });

module.exports = {
    sendEmailCron
}