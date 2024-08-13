const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const db = require('./dbase')
const mailer = require('./mailer')
const letterBuilder = require('./letterBuilder')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs'); 

dotenv.config()


// accepts standard HTML form data plus JSON-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())

app.set('view engine', 'ejs');

db.init()

/*
Check that the .env file has been properly set up
*/
if (!fs.existsSync('.env')) {
  throw new Error('No .env file found. Please run setup wizard by running \'node setup.js\'');
}

/*
Now check that all of the (required) variables have been filled out
*/

if(
  !(process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.NEWSLETTER_TITLE &&
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD
  ) != (null || "")
){
  throw new Error("One or more of the required .env variables has not been filled out. Please refer to the README.md file.")
}

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
          mailer.massEmail(process.env.NEWSLETTER_TITLE, emails, metadata.title, metadata.raw, metadata.html)
          return true
      });
  });
}

function generateAuthToken(){
  return crypto.randomBytes(30).toString('hex')
}

function checkIfAuth(cookies){
  console.log(cookies)
  if("token" in JSON.parse(cookies)){
    console.log("Token cookie is set, asking database")
    const x = db.getDBObject()
    const cooky = []
    x.serialize(() => {
      x.each("SELECT * from tokens WHERE tkn=?", [JSON.parse(cookies).token], (err, row) => {
          if (err) {
              console.error(err);
              //return res.status(500).send("DB error, check logs/db");
              return false
          }
          console.log(row)
          cooky.push(row);
      }, () => {
          // The callback, so after the HTTP request is done
          x.close();
          // if the array of cookies pulled from the databse is longer than 0, that means
          // we found a match, so the cookie in the browser is valid!
          console.log("database operations all done")
          console.log(cooky.length)
          return (cooky.length != 0)
      });
  });
  }
  // no cookie set, so false
  return false
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

  if("token" in req.cookies){
    x.get('SELECT * FROM tokens WHERE tkn = ?', [req.cookies.token], (err, row) => {
      if (err) {
        return res.status(500).send('Database error.');
      }
  
      if (row) {
        console.log("*** AUTHENTICATED USER, CONTINUE TO ADMIN PAGE ***")
      } else {
        // cookie is invalid, send to login
        return res.redirect("/admin/login")
      }
    });
  }else{
    // there is no cookie, send to homepage
    return res.redirect("/admin/login")
  }
  
  if("action" in req.query){
    if(req.query.action == "delete"){
      // delete emails
      return res.send("deleted users")
    }
    if(req.query.action == "test"){
      // test newsletter
      var newsletterMetaData = letterBuilder.buildTestNewsletter()
      massMailer(newsletterMetaData, res)
      return res.send("sent the test newsletter")
    }
    if(req.query.action == "send"){
      // send the newsletter
      var newsletterMetaData = letterBuilder.buildNewsletter()
      massMailer(newsletterMetaData, res)
      return res.send("sent the newsletter")
    }
    if(req.query.action == "debug"){
      res.setHeader('Content-Type', 'application/json');
      var env_status = ((process.env.SMTP_USER && process.env.SMTP_HOST && process.env.SMTP_PASS && process.env.NEWSLETTER_TITLE) != null)
      // Guide to the debug page
      // os: Operating System
      // env_configuration: Are all of the parameters of the .env file set?
      return res.end(JSON.stringify({
        'os': process.platform,
        'env_configuration': env_status
      }));
    }
  }

  // if the user has not requested any of the action pages above,
  // they will be shown the plain admin panel
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
          return res.render('admin', { emails: emails });
      });
  });
});

// The most important part of the admin page, the login
app.get('/admin/login', async function(req, res){
  if(checkIfAuth(JSON.stringify(req.cookies))){
    console.log("User attempted to access login page, but was already logged in...")
    res.redirect("/admin")
  }
  res.render('login')
})

app.post('/admin/login', async function(req, res){
  // if(checkIfAuth(JSON.stringify(req.cookies))){
  //   console.log("User attempted to use login page, but was already logged in...")
  //   res.redirect("/admin")
  // }
  res.clearCookie("token")

  var username = req.body.username
  var password = req.body.password

  //https://stackabuse.com/handling-authentication-in-express-js/
  // Review ^^^^^^^

  if(username == process.env.ADMIN_USERNAME && password == process.env.ADMIN_PASSWORD){
    // create a new authtoken
    const authToken = generateAuthToken()
    // add it to the database (current time is set in dbase.js)
    db.insertToken(authToken)
    // add it to the local cookies (and make it expire 24 hours from now)
    res.cookie('token', authToken, 
      { expires: new Date(Date.now() + (24 * 60 * 60)),});
    
    // send user to the admin homepage
    res.redirect("/admin")
    
  }else{
    res.redirect("/admin/login?error=true")
  }

})

app.get('/test', function (req, res) {
  res.render('admin2', {title: `${process.env.NEWSLETTER_TITLE} | Home`, index: true})
})

app.listen(3000)