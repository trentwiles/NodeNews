const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const db = require("./pgbase");
const mailer = require("./mailer");
const letterBuilder = require("./letterBuilder");
const dotenv = require("dotenv");
const cron = require("./cronjob");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const fs = require("fs");
const PORT = 3000;

dotenv.config();

// accepts standard HTML form data plus JSON-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

/*
Check that the .env file has been properly set up
*/
if (!fs.existsSync(".env")) {
  throw new Error(
    "No .env file found. Please run setup wizard by running 'node setup.js'"
  );
}

/*
Now check that all of the (required) variables have been filled out
*/

if (
  !(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.NEWSLETTER_TITLE &&
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD
  ) != (null || "")
) {
  throw new Error(
    "One or more of the required .env variables has not been filled out. Please refer to the README.md file."
  );
}

console.log("---- Checks Passed ----");
console.log("Server running on port " + PORT);

/*
Functions
*/
function massMailer(metadata, res) {
  var emails = [];

  x.serialize(() => {
    x.each(
      "SELECT email from eml",
      (err, row) => {
        if (err) {
          console.error(err);
          return res.status(500).send("DB error, check logs/db");
        }
        emails.push(row.email);
      },
      () => {
        // close database connection
        x.close();
        mailer.massEmail(
          process.env.NEWSLETTER_TITLE,
          emails,
          metadata.title,
          metadata.raw,
          metadata.html
        );
        return true;
      }
    );
  });
}

function generateAuthToken() {
  return crypto.randomBytes(30).toString("hex");
}

async function checkIfAuth(cookies) {
  return false;
}
/*
End Functions
*/

app.get("/", function (req, res) {
  res.render("home", {
    title: `${process.env.NEWSLETTER_TITLE} | Home`,
    index: true,
  });
});

app.get("/test", async function (req, res) {
  try {
    const api = await db.query("SELECT * FROM eml", []);
    res.json({ count: api.length, data: api }); // ✅ Send response
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Database error" }); // ✅ Handle errors properly
  }
});

app.post("/subscribe", async function (req, res) {
  // maybe add recaptcha here?
  var email = req.body.email;

  // replace this with a future captcha implementation
  var captchaStatus = true;
  if (captchaStatus && email != null) {
    await db.query("INSERT INTO eml(email, ts) VALUES($1, $2)", [
      email,
      Math.floor(Date.now() / 1000),
    ]);
    res.redirect("/thanks");
  } else {
    res.send("Invalid");
  }
});

app.get("/thanks", function (req, res) {
  res.render("thanks", { title: "Thank You", index: false });
});

app.get("/unsubscribe", function (req, res) {
  res.render("unsub", { title: "Unsubcribe", index: false });
});

async function validate(req) {
  const tokenInCookies = "token" in req.cookies;
  if (!tokenInCookies) {
    return null;
  }
  const username = await db.query(
    "SELECT username FROM tokens WHERE tkn = $1",
    [req.cookies.token]
  );
  return username;
}

app.get("/admin", async function (req, res) {
  // check to make sure the user is an admin...

  const username = await validate(req);
  if (username == null) {
    return res.redirect("/admin/login");
  }

  // if the user has not requested any of the action pages above,
  // they will be shown the plain admin panel
  var qty = await db.query("SELECT COUNT(DISTINCT email) as c FROM eml");
  var emails = await db.query("SELECT email FROM eml ORDER BY ts DESC LIMIT 3");
  return res.render("admin2", {
    emails: emails,
    qty: qty[0]["c"],
    username: username,
  });
});

/* ADMIN INTERNAL API METHODS */
app.get("/admin/api/wipeEmails", async function (req, res) {
  const validation = await validate(req);
  if (validation == null) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const deleteCount = await db.query("SELECT count(eml) as qty FROM eml");
  await db.query("DELETE FROM eml WHERE 1=1");
  return res
    .status(200)
    .json({ status: `OK, deleted ${deleteCount[0]["qty"]} emails` });
});

app.get("/admin/api/viewAuditLog", async function (req, res) {
  const validation = await validate(req);
  if (validation == null) {
    return res.status(401).json({ message: "unauthorized" });
  }

  await db.query(
    "INSERT INTO audit_log (action, ip_address, username, ts) VALUES($1, $2, $3, $4)",
    [
      "VIEW_AUDIT_LOG",
      req.ip,
      validation[0]["username"],
      Math.floor(Date.now() / 1000),
    ]
  );
  const log = await db.query(`SELECT *
                              FROM audit_log
                              ORDER BY ts DESC
                              LIMIT 15`);
  return res.status(200).json({ status: "OK", log: log });
});

// The most important part of the admin page, the login
app.get("/admin/login", async function (req, res) {
  if ("token" in req.cookies) {
    // if there's a token in the browser, we validate it before moving on
    const isValid = await db.query(`SELECT 1 FROM tokens WHERE tkn = $1`, [
      req.cookies.token,
    ]);
    if (isValid.length > 0) {
      return res.redirect("/admin");
    }
  }

  res.render("login");
});

app.post("/admin/login", async function (req, res) {
  res.clearCookie("token");

  var username = req.body.username;
  var password = req.body.password;

  //https://stackabuse.com/handling-authentication-in-express-js/
  // Review ^^^^^^^

  const count = await db.query("SELECT 1 FROM users WHERE username = $1", [
    username,
  ]);
  if (count.length != 1) {
    return res.redirect("/admin/login?error=invalid_username");
  }

  // since this is really only a demo app, passwords will be stored in plaintext for the time being
  const validPassword = await db.query(
    "SELECT 1 FROM users WHERE username = $1 AND password = $2",
    [username, password]
  );

  if (validPassword.length != 1) {
    await db.query(
      `INSERT INTO audit_log (action, ip_address, username, ts) VALUES($1, $2, $3, $4)`,
      ["INVALID_LOGIN_ATTEMPT", req.ip, username, Math.floor(Date.now() / 1000)]
    );
    return res.redirect("/admin/login?error=invalid_password");
  }

  await db.query(
    `INSERT INTO audit_log (action, ip_address, username, ts) VALUES($1, $2, $3, $4)`,
    ["VALID_LOGIN", req.ip, username, Math.floor(Date.now() / 1000)]
  );
  console.log("yay valid password");

  // if we've made it to this point, we know the user has a valid password
  // therefore, we can create the token
  const token = generateAuthToken();
  await db.query("INSERT INTO tokens (tkn, username, ts) VALUES ($1, $2, $3)", [
    token,
    username,
    Math.floor(Date.now() / 1000),
  ]);

  // add it to the local cookies (and make it expire 24 hours from now)
  res.cookie("token", token, { expires: new Date(Date.now() + 24 * 60 * 60) });

  res.redirect("/admin");
});

app.get("/logout", async function (req, res) {
  // delete the token from the database
  if ("token" in req.cookies) {
    await db.query("DELETE FROM tokens WHERE tkn=$1", [req.cookies.token]);
  }
  res.clearCookie("token");
  res.redirect("/");
});

app.get("/admin/api/cleanTokens", async function (req, res) {
  const validation = await validate(req);
  if (validation == null) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // route that should be POSTed by a cronjob every so often to flush out old cookies
  // aka deletes tokens older than 24 hours
  await db.query(
    `
    WITH cte AS (SELECT tkn FROM tokens WHERE (EXTRACT(EPOCH FROM NOW())::BIGINT - ts) >= (60 * 60 * 24))
    DELETE FROM tokens
    WHERE tkn IN (select * from cte)
    `
  );
  console.log("Token database cleaned!");
  return res.send(
    JSON.stringify({
      success: true,
    })
  );
});

app.get("/admin/api/getTemplates", async function (req, res) {
  const validation = await validate(req);
  if (validation == null) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // consider adding an option for a limit here in the future
  const templates = await db.query(
    `SELECT tid, title, description, isDraft, owner FROM templates ORDER BY title ASC`
  );
  return res.status(200).json({ templates: templates });
});

app.get("/admin/api/getTemplateById/:id", async function (req, res) {
  const validation = await validate(req);
  if (validation == null) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const id = req.params.id;

  // consider adding an option for a limit here in the future
  const templates = await db.query(`SELECT * FROM templates WHERE tid=$1`, [
    id,
  ]);
  return res.status(200).json({ templates: templates });
});

// todo: overhaul the email sending functionality
app.post("/admin/api/massSendEmail", async function (req, res) {
  // first, make sure the user is authenticated
  const username = req.body.username;
  const password = req.body.password;

  const validPasswordCombo = await db.query(
    `SELECT 1 FROM users WHERE username = $1 AND password = $2`,
    [username, password]
  );

  if (validPasswordCombo.length == 0) {
    return res
      .status(400)
      .json({
        status: 400,
        message:
          "Invalid password/username combination. You must POST these values to this endpoint each time you would like to send email.",
      });
  }

  // once that's out of the way, we can call the function from the cronjob.js file
  await cron.sendEmailCron();

  return res.end(
    JSON.stringify({
      success: true,
    })
  );
});

app.listen(PORT);
