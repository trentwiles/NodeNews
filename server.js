const express = require('express')
const app = express()
const db = require('./dbase')

app.set('view engine', 'ejs');

db.init()

app.get('/', function (req, res) {
  res.render('index', {title: "Home"})
})

app.post('/subscribe', function (req, res) {
  // maybe add recaptcha here?
  var email = req.body.id
  // temp captcha mock code
  var captchaStatus = (1=1)
  if(captchaStatus && email != null){
    db.insertEmail(email)
    res.send('It works!')
  }else{
    res.send('Invalid')
  }
})

app.listen(3000)