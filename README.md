# NodeNews

Customizable newsletter software, with frontend and admin panel.

## Features
* User interface
* SQLite DB
    * Insert emails
    * Insert tokens
    * Delete emails
    * Query emails
* SMTP (send, connect)
* Newsletter generation
* Admin panel (list emails, delete emails, debug, test email)

## Run

1. Install dependencies
```
npm i
```

2. Configation, via `.env` file

Copy the provided .env.example file to .env. Fill out the required fields.

3. Configure the crontab

Set up a pinger service to send a POST request to `/cleanTokens` as often as possible.

3. Run the webserver
```
node .
```
By default, it will run on port 3000.

## Setting up Gmail SMTP
Gmail is a free way to get started with sending emails. Set the `SMTP_HOST` to `smtp.gmail.com`, `SMTP_USERNAME` to your email (including the @gmail.com), and `SMTP_PASSWORD` to your app password (guide to that [linked here](https://myaccount.google.com/apppasswords)). Note that Gmail limits how many daily emails you can send.

## Skills Used
* NodeJS
* SQLite
* ExpressJS

This is my first full service NodeJS project.