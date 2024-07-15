const express = require('express')
const app = express()
const db = require('./dbase')

db.init()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(3000)