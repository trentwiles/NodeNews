const db = require('./dbase')
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
switch (DATE.getDay()){
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
<p>Good morning! Today is ${DAYS[DATE.getDay()-1]}, the ${DATE.getDay()}${extension} of ${MONTHS[DATE.getMonth()-1]}, ${DATE.getFullYear()}. Here are five things you need to know...</p>
<ul>
<li>Always smile</li>
<li>Don't forget to brush your teeth</li>
<li>Keep in touch with your family</li>
</ul>
`

const $ = cheerio.load(CONTENTS)
const TEXT_ONLY = $.text()

