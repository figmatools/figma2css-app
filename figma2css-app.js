#!/usr/bin/env node

const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  open = require('open'),
  program = require('commander');

const fetchProject = require('figmafetch-module')

const runServer = () => {
  app.use(express.json())
    .use(bodyParser.json())

  app.get('/', function (req, res) {
    res.send('<p>The frontend will live here!</p>');
  })

  app.get('/data', async function (req, res) {
    let id = 'YZkG7swHVcXXJ6gA5PfLuNzw'
    let token = '12606-e447b778-09cc-4bd3-91e8-843146de402d';
    let data = await fetchProject(id, token);
    data = data;
    data['headers'] = { token: token, id: id };
    res.send(data);
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
