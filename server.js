const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const db = require('./pgbase')
const mailer = require('./mailer')
const letterBuilder = require('./letterBuilder')
const dotenv = require('dotenv')
const cron = require('./cronjob')
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs'); 
const PORT = 3000

dotenv.config()


// accepts standard HTML form data plus JSON-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())

app.set('view engine', 'ejs');

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

console.log("---- Checks Passed ----")
console.log("Server running on port " + PORT)

/*
Functions
*/
function massMailer(metadata, res){
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

async function checkIfAuth(cookies){
  return false
}
/*
End Functions
*/

app.get('/', function (req, res) {
  res.render('home', {title: `${process.env.NEWSLETTER_TITLE} | Home`, index: true})
})

app.get('/test', async function (req, res) {
  try {
    const api = await db.query("SELECT * FROM eml", []);
    res.json({ count: api.length, data: api }); // ✅ Send response
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Database error" }); // ✅ Handle errors properly
  }
});


app.post('/subscribe', async function (req, res) {
  // maybe add recaptcha here?
  var email = req.body.email

  // replace this with a future captcha implementation
  var captchaStatus = true
  if(captchaStatus && email != null){
    await db.query("INSERT INTO eml(email, ts) VALUES($1, $2)", [email, Math.floor(Date.now() / 1000)]);
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

app.get('/admin', async function(req, res){
  // check to make sure the user is an admin...

  if("token" in req.cookies){

    const isValid = await db.query("SELECT 1 FROM tokens WHERE tkn=$1", [req.cookies.token])

    if (isValid.length == 0) {
      return res.redirect("/admin/login")
    }
  }else{
    // there is no cookie, send to homepage
    return res.redirect("/admin/login")
  }
  
  if("action" in req.query){
    if(req.query.action == "delete"){
      // delete emails
      await db.query("DELETE FROM eml WHERE 1=1;", [])
      return res.send("deleted users")
    }
    if(req.query.action == "test"){
      // test newsletter
      var newsletterMetaData = letterBuilder.buildTestNewsletter()
      massMailer(newsletterMetaData, res)
      await db.closeConnection()
      return res.send("sent the test newsletter")
    }
    if(req.query.action == "send"){
      // send the newsletter
      var newsletterMetaData = letterBuilder.buildNewsletter()
      massMailer(newsletterMetaData, res)
      await db.closeConnection()
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
  var emails = await db.query("SELECT email FROM eml");
  return res.render('admin2', { emails: emails });
});

// The most important part of the admin page, the login
app.get('/admin/login', async function(req, res){
  // if(checkIfAuth(JSON.stringify(req.cookies))){
  //   console.log("User attempted to access login page, but was already logged in...")
  //   res.redirect("/admin")
  // }
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

  const count = await db.query("SELECT 1 FROM users WHERE username = $1", [username])
  if (count.length != 1) {
    return res.redirect("/admin/login?error=invalid_username")
  }

  // since this is really only a demo app, passwords will be stored in plaintext for the time being
  const validPassword = await db.query("SELECT 1 FROM users WHERE username = $1 AND password = $2", [username, password])

  if (validPassword.length != 1) {
    return res.redirect("/admin/login?error=invalid_password")
  }

  console.log("yay valid password")

  // if we've made it to this point, we know the user has a valid password
  // therefore, we can create the token
  const token = generateAuthToken()
  await db.query("INSERT INTO tokens (tkn, username, ts) VALUES ($1, $2, $3)",
    [token, username, Math.floor(Date.now()/1000)]
  )

  // add it to the local cookies (and make it expire 24 hours from now)
  res.cookie('token', token, 
    { expires: new Date(Date.now() + (24 * 60 * 60)),});


  res.redirect('/admin')
})

app.get('/logout', async function (req, res) {
  // delete the token from the database
  if("token" in req.cookies){
    await db.query("DELETE FROM tokens WHERE tkn=$1", [req.cookies.token])
  }
  res.clearCookie('token')
  res.redirect('/')
})

app.post('/cleanTokens', function(req, res) {
  // route that should be POSTed by a cronjob every so often to flush out old cookies
  db.clearExpiredTokens()
  console.log("Token database cleaned!")
  return res.end(JSON.stringify({
    'success': true
  }))
})

app.post('/sendEmail', function(req, res) {
  // first, make sure the user is authenticated
  password = req.body.password

  if(password == null || password != process.env.ADMIN_PASSWORD){
    return res.end(JSON.stringify({
      'success': false,
      'message': 'Missing/invalid password. Hint: send the password in the POST body.'
    }))
  }
  
  // once that's out of the way, we can call the function from the cronjob.js file
  cron.sendEmailCron()

  return res.end(JSON.stringify({
    'success': true,
  }))

})

app.listen(PORT)