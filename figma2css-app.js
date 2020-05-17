#!/usr/bin/env node

const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  open = require('open'),
  program = require('commander'),
  path = require('path');

const fetchProject = require('figmafetch-module');

const runServer = () => {
  app.use(express.json())
    .use(bodyParser.json())
    .use(express.static('public'));

  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/index.html'));
  });

  app.get('/data', async function (req, res) {
    // ?figmaAccessToken=[token]&fileId=[id]
    let id = req.query.fileId;
    let token = req.query.figmaAccessToken;
    if(!id || !token) {
      res.status(500).send("Error");
    }
    let data = await fetchProject(id, token);
    data = data;
    data['headers'] = { token: token, id: id };
    res.send(data);
  });

  app.listen(4200, function () {
    console.log('fake server running on 4200!');
  });

  open('http://localhost:4200/')
};

program
  .description('run server!')
  .action(async function(cmd) {
  runServer()
});

program.parse(process.argv);
