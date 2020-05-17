#!/usr/bin/env node

const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  open = require('open'),
  program = require('commander'),
  path = require('path'),
  fs = require('fs');

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
    }else{
      let figmaData = await fetchProject(id, token);
      figmaData['headers'] = { token: token, id: id };
      fs.writeFileSync('./data', JSON.stringify(figmaData, null, 2), 'utf-8');
      res.send(figmaData);
    }
  });

  const findElement = (item, id) => { 
    let result = null;
    if(!item.children) return null;
    for(let child of item.children) {
      if(child.id === id) {
        result = child;
        return result;
        break
      } else {
        result = findElement(child, id);
      }
    }
    return result
  };

  app.get('/css', async function (req, res) {
    let data = await fs.readFileSync('./data', 'utf-8');
    data = JSON.parse(data);
    let result = findElement(data.document, '1:5');
    console.log('result: ', result);
    res.send(result);
  });

  app.listen(4200, function () {
    console.log('fake server running on 4200!');
  });

  //open('http://localhost:4200/')
};

program
  .description('run server!')
  .action(async function(cmd) {
  runServer()
});

program.parse(process.argv);
