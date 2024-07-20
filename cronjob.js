const newsletter = require('./letterBuilder')
const mail = require('./mailer')
const db = require('./dbase')

// When executed, this script will select all emails
// from the database, the sends the newsletter to
// said emails.

const NL_DATA = newsletter.buildNewsletter()
const NL_TITLE = NL_DATA["title"]
const NL_HTML = NL_DATA["html"]
const NL_TEXT = NL_DATA["raw"]

db.selectAll()
    .then(result => {
        console.log(result); // Process the result
        // Now do something else after getting the result
    })
    .catch(error => {
        console.error('Error:', error);
    });