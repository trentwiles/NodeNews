const db = require("../pgbase");

async function main() {
    const x = await db.query("select NOW()", [])
    console.log(x)
    return x
}

async function createUsers() {
    await db.init()
    const users = [
        ['james', 'admin123', 'A'],
        ['martha', 'iloveyou', 'U'],
        ['frank', 'password123', 'U']
        ['crontab_bot', 'nAUWnf39@^^fnllajhfbbmaiso', 'B']
    ]

    for(var i = 0; i < users.length; i++) {
        await db.query(`INSERT INTO users(username, password, permissions, joinTime, lastAccessedTime) 
                        VALUES($1, $2, $3, $4, $5)`, [...users[i], Math.floor(Date.now()/1000), 0])
    }
}

async function createEmails() {
    await db.init();
    const emails = [
        ["me@trentwil.es", 938],
        ["abuse@trentwil.es", 192],
        ["wiles.t@northeastern.edu", 1029]
    ]

    for(var i = 0; i < emails.length; i++) {
        await db.query(`INSERT INTO eml(email, ts) VALUES($1, $2)`, [...emails[i]])
    }
}

async function createTemplates() {
    // assumes that the users outlined in the createUsers function have already
    // been added into the database, otherwise this won't run, as there is a FK
    // between templates.owner and users.username
    await db.init()

    const templates = [
        [281293, "Basic Template", "This is the first...", "<h2>Welcome!</h2><p>Today is $date$ and here are the headlines:<ul><li>$headline$</li></ul>", false, "martha"],
        [923985, "Unique Template", "A template that's a bit more on the unique side", "<marquee>$title$</marquee>", true, "james"],
        [432793, "Boring Template", "I probably wouldn't use this template if I were you.", "<i>$random_variable$</i><br><p>some filler</p>", false, "james"]
    ]

    templates.forEach(async (yea) => {
        await db.query("INSERT INTO TEMPLATES (tid, title, description, contents, isDraft, owner) VALUES($1, $2, $3, $4, $5, $6)",
            yea
        )
    })

    return
}

createTemplates();