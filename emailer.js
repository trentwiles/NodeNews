const db = require('./dbase')
const dotenv = require('dotenv')
const cheerio = require('cheerio')
const fs = require('fs')

dotenv.config()

const TITLE = process.env.NEWSLETTER_TITLE
async function doo(){
    fs.readFile('static/one.html', 'utf8', (error, data) => {
        if (error) {
            console.error('An error occurred while reading the file:', error);
            return;
        }
        return data
    });
}
async function doo2(){
    var nl = await doo()
    console.log(nl)
}

doo2()
/*
`
<h1>This is my newsletter</h1>
<p>Good morning! Here are five things you need to know...</p>
<ul>
<li>Always smile</li>
<li>Don't forget to brush your teeth</li>
<li>Keep in touch with your family</li>
</ul>
`
*/