const axios = require('axios')
const db = require('./dbase')
// testing file to add a few emails
const x = db.getDBObject()
x.serialize(() => {
    x.each("SELECT * from tokens WHERE 1=1", (err, row) => {
        if (err) {
            console.error(err);
            //return res.status(500).send("DB error, check logs/db");
            return false
        }
        console.log(row)
        cookies.push(row);
    }, () => {
        // The callback, so after the HTTP request is done
        x.close();
        // if the array of cookies pulled from the databse is longer than 0, that means
        // we found a match, so the cookie in the browser is valid!
        console.log("database operations all done")
        console.log(cookies.length)
        return (cookies.length != 0)
    });