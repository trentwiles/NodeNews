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

3. Run the webserver
```
node .
```
By default, it will run on port 3000.

## Skills Used
* NodeJS
* SQLite
* ExpressJS

This is my first full service NodeJS project.