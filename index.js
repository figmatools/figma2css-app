const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  open = require('open')

app.use(express.json())
  .use(bodyParser.json())

app.get('/', function (req, res) {
  res.send('<p>The frontend will live here!</p>');
})

app.listen(4200, function () {
  console.log('fake server running on 4200!');
});

open('http://localhost:4200/')
