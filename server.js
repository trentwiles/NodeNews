const express = require('express')
const app = express()
const db = require('./dbase')

app.set('view engine', 'ejs');

db.init()

app.get('/', function (req, res) {
  res.render('index', {title: "Home", index: true})
})

app.post('/subscribe', function (req, res) {
  // maybe add recaptcha here?
  var email = req.body.id
  // temp captcha mock code
  var captchaStatus = true
  if(captchaStatus && email != null){
    db.insertEmail(email)
    res.redirect("/thanks")
  }else{
    res.send('Invalid')
  }
})

app.get('/thanks', function (req, res){
  res.render('thanks', {title: "Thank You", index: false})
})

app.get('/unsubscribe', function(req, res){
  res.render('unsub', {"title": "Unsubcribe", index: false})
})

app.listen(3000)