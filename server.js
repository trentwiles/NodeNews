const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const db = require('./dbase')
const mailer = require('./mailer')
const letterBuilder = require('./letterBuilder')
const dotenv = require('dotenv')

dotenv.config()


// accepts standard HTML form data plus JSON-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

db.init()

/*
Functions
*/
function massMailer(metadata, res){
  const x = db.getDBObject()
  var emails = []

  x.serialize(() => {
      x.each("SELECT email from eml", (err, row) => {
          if (err) {
              console.error(err);
              return res.status(500).send("DB error, check logs/db");
          }
          emails.push(row.email);
      }, () => {
        // close database connection
          x.close();
          mailer.massEmail("Newsletter Github", emails, metadata.title, metadata.raw, metadata.html)
          res.send(emails)
      });
  });
}
/*
End Functions
*/

app.get('/', function (req, res) {
  res.render('home', {title: `${process.env.NEWSLETTER_TITLE} | Home`, index: true})
})

app.post('/subscribe', function (req, res) {
  // maybe add recaptcha here?
  var email = req.body.email

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

app.get('/admin', function(req, res){
  // check to make sure the user is an admin...
  const x = db.getDBObject();
  var emails = [];
  
  x.serialize(() => {
      x.each("SELECT email from eml", (err, row) => {
          if (err) {
              console.error(err);
              return res.status(500).send("DB error, check logs/db");
          }
          emails.push(row.email);
      }, () => {
          // The callback, so after the HTTP request is done
          x.close();
          res.render('admin', { emails: emails });
      });
  });
});

app.post('/admin/delete', function(req, res){
  // check to make sure the user is an admin...

  // and maybe another check to make sure they are using some xsrf key...

  db.wipeEmails()
  res.redirect('/admin/?deleted=true')
})

app.post('/admin/test', function(req, res){
  var newsletterMetaData = letterBuilder.buildTestNewsletter()
  massMailer(newsletterMetaData, res)
})

app.post('/admin/send', function(req, res){
  // more or less the /admin/test route, but with real email contents
  var newsletterMetaData = letterBuilder.buildNewsletter()
  massMailer(newsletterMetaData, res)
})

app.get('/admin/debug', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  var env_status = ((process.env.SMTP_USER && process.env.SMTP_HOST && process.env.SMTP_PASS && process.env.NEWSLETTER_TITLE) != null)
  // Guide to the /admin/debug page
  // os: Operating System
  // env_configuration: Are all of the parameters of the .env file set?
  res.end(JSON.stringify({
    'os': process.platform,
    'env_configuration': env_status
  }));
})

app.listen(3000)