const db = require("../pgbase");

async function main() {
    const x = await db.query("select NOW()", [])
    console.log(x)
    return x
}

main();