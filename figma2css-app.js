#!/usr/bin/env node

const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  open = require('open'),
  program = require('commander');

const runServer = () => {
  app.use(express.json())
    .use(bodyParser.json())

  app.get('/', function (req, res) {
    res.send('<p>The frontend will live here!</p>');
  })

  app.listen(4200, function () {
    console.log('fake server running on 4200!');
  });

  open('http://localhost:4200/')
} 

program
  .description('run server!')
  .action(async function(cmd) {
  runServer()  
});

program.parse(process.argv);


