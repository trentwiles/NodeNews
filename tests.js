const axios = require('axios')

// testing file to add a few emails
for(var i = 0; i < 4; i++){
    var random = Math.floor(Math.random() * 10)
    console.log(random)
    axios.post('http://localhost:3000/subscribe', {'email': 'trent' + random + '@example.com'})
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
}