const db = require("../pgbase");

async function main() {
    // recipie: connect, initialize (create databases if not already there), insert item
    // then show item, and disconnect
    await db.connectDB();
    await db.init();

    await db.insertEmail("franklin" + Math.floor(Math.random() * 1000) + "@gmail.com");

    const res = await db.selectAll();
    console.log(res);


    await db.closeConnection();
    console.log("Done.");
    process.exit(0);
}

main();