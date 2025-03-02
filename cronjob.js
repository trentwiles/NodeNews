const newsletter = require('./letterBuilder')
const mail = require('./mailer')
const db = require('./pgbase')

async function sendEmailCron(){
    // When executed, this script will select all emails
    // from the database, the sends the newsletter to
    // said emails.

    const NL_DATA = newsletter.buildNewsletter()
    const NL_TITLE = NL_DATA["title"]
    const NL_HTML = NL_DATA["html"]
    const NL_TEXT = NL_DATA["raw"]
    //const NL_SENDER_NAME = NL_DATA["name"]
    // For now, sender name is just the title of the newsletter, to be changed in a future update

    const emails = await db.query("SELECT * FROM eml");
    emails.forEach((api) => {
        mail.send(NL_TITLE, api.email, NL_TITLE, NL_TEXT, NL_HTML)
        console.log("Queued an email to " + row.email)
    })

}

module.exports = {
    sendEmailCron
}