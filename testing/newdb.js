const db = require("../pgbase")

db.init()
db.insertEmail("franklin" + Math.random() * 1000 + "@gmail.com")

db.selectAll()
    .then( (res) => {
        console.log(res)
    })
    .finally( () => db.terminateConnection())