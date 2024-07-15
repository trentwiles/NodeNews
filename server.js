const express = require('express')
const app = express()
const db = require('./dbase')

app.set('view engine', 'ejs');

db.init()

app.get('/', function (req, res) {
  res.render('index', {title: "Home"})
})

app.post('/subscribe', function (req, res) {
  res.send('Hello World')
})

app.listen(3000)