var express = require('express');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var db = require('../database-mysql');
var APIKey = require('./yelpAPI.js');
var axios = require('axios');

var app = express();
app.use(express.static(__dirname + '/../react-client/dist'));
app.use(bodyParser.json())

var checkSession = {}

app.post('/signup', (req, res) => {
  if (req.body.username && req.body.password) {
    var user = req.body.username
    var pass = req.body.password
    var zipcodefrom = req.body.zipcodefrom
    db.connection.query(
      `SELECT * FROM users WHERE username = '${user}'`,
      function(err, results) {
        if (err) console.error(err);
        if (results.length === 0) { 
          bcrypt.hash(pass, null, null, (err, hash) => {
            if (err) console.error(err)
            db.connection.query(
              `INSERT INTO users (id, username, password, zipcodefrom, totalbudget) VALUES (?, ?, ?, ?, ?)`,
              [null, user, hash, zipcodefrom, null, null], 
              function(err) {
                if (err) console.error(err)
                db.connection.query(
                  `SELECT id FROM users WHERE username = '${user}'`,
                  function(err, results) {
                    if (err) { console.error(err) }
                    var id = results[0].id            
                    db.connection.query(
                      `INSERT INTO todos (id, user, task, price, complete, searchterm) VALUES 
                      (null, ${id}, 'End your lease', null, 0, null),
                      (null, ${id}, 'Buy packing supplies', 50, 0, null),   
                      (null, ${id}, 'Pack your things', null, 0, null),
                      (null, ${id}, 'Hire movers or rent a truck', 200, 0, null),
                      (null, ${id}, 'Pack the truck', null, 0, null),
                      (null, ${id}, 'Clean your old place', null, 0, null),
                      (null, ${id}, 'Drive the truck', null, 0, null),
                      (null, ${id}, 'Unpack and enjoy your new home!', null, 0, null)`, 
                      function(err) {
                        if (err) console.error(err)
                        res.status(201).send(/*affirmative*/)
                      } 
                    )
                  }
                )
              }
            )
          })
        } else {
          res.status(403).send(/*negative*/)
        }
      }
    )
  } else {
    res.status(403).send(/*negative*/)
  }
})

app.post('/login', (req, res) => {
  if (req.body.username && req.body.password) {
    var user = req.body.username
    var pass = req.body.password
    db.connection.query(
      `SELECT * FROM users WHERE username = ${user}`,
      function(err, results) {
        if (err) console.error(err);
        if (results.length > 0) {
          bcrypt.compare(pass, results[0].password, function(err, exists) {
            if (exists) {
              req.session.userId = results[0].id
              res.status(201).send(/*affirmative*/)
            } else {
              res.status(403).send(/*negative*/)
            }
          })
        } else {
          res.status(403).send(/*negative*/)
        }
      }
    )
  } else {
    res.status(403).send(/*negative*/)
  }
})

app.post('/userdata', (req, res) => {
  db.connection.query(
    `UPDATE users SET zipcodefrom = ${req.zipcodefrom}, zipcodeto = ${req.zipcodeto} WHERE id = ${req.userId}`, 
    function(err) {
      if (err) console.error(err)
      res.status(201).send()
    }
  )
})

app.post('/tasks', (req, res) => {
  db.connection.query(
    `INSERT INTO tasks (id, user, task, price, complete, searchterm) VALUES (?, ?, ?, ?, ?, ?)`,
    function(err) {
      if (err) console.error(err)
      res.status(201).send()
    }
  )
})

app.post('/budget', (req, res) => {
  db.connection.query(
    `UPDATE users SET totalbudget = ${req.budget} WHERE id = ${req.userId}`,
    function(err) {
      if (err) console.error(err)
      res.status(201).send()
    }
  )
})

app.get('/services', (req, res) => {
	console.log("INSIDE SERVER", req.query)
	axios.get('https://api.yelp.com/v3/businesses/search', {
  	headers: {
  		Authorization : `Bearer ${APIKey.yelpAPI}`
  	}, 
  	params: {
  		term: req.query.term,
  		location: req.query.location,
  		sort_by: 'distance',
  		limit: 10
  	}
  })
  .then((response) => {
  	res.send(response.data)
  })
  .catch((err) => {
    console.error(err)
  })
})

app.get('/map', (req, res) => {
  map.plotLocation(req.latitude, req.longitude)
  .then((result) => {
    res.status(200).send(result)
  })
  .catch((err) => {
    console.error(err)
  })
})

app.listen(3000, function() {
  console.log('listening on port 3000!');
});