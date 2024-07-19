const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const db = require('./dbase')

// accepts standard HTML form data plus JSON-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

db.init()

app.get('/', function (req, res) {
  res.render('index', {title: "Home", index: true})
})

app.post('/subscribe', function (req, res) {
  // maybe add recaptcha here?
  var email = req.body.email
  var terms = req.body.terms

  if(terms != 'on'){
    res.redirect('/?error=terms')
  }

  // replace this with a future captcha implementation
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