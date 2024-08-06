const dotenv = require('dotenv')
const cheerio = require('cheerio')

dotenv.config()

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
]

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
]
const DATE = new Date()

var extension = "th"
switch (DATE.getDate()){
    case(1):
        extension = "st"
        break;
    case (2):
        extension = "nd"
        break
}

const TITLE = process.env.NEWSLETTER_TITLE
const CONTENTS = `
<h1>This is my newsletter</h1>
<p>Good morning! Today is ${DAYS[DATE.getDay()-1]}, the ${DATE.getDate()}${extension} of ${MONTHS[DATE.getMonth()]}, ${DATE.getFullYear()}. Here are five things you need to know...</p>
<ul>
<li>Always smile</li>
<li>Don't forget to brush your teeth</li>
<li>Keep in touch with your family</li>
</ul>
`

const $ = cheerio.load(CONTENTS)
const TEXT_ONLY = $.text()

function buildNewsletter(){
    return {
        "title": TITLE,
        "html": CONTENTS,
        "raw": TEXT_ONLY
    }
}

function buildTestNewsletter(){
    var epoch = Math.floor(+ new Date()/1000) 
    var testString = "Timestamp: " + epoch + " - This is a test email that can be ignored"
    return {
        "title": "*** TEST EMAIL ***",
        "html": `<p>${testString}</p>`,
        "raw": testString
    }
}

module.exports = {
    buildNewsletter,
    buildTestNewsletter
}