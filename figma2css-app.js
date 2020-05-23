#!/usr/bin/env node

const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  open = require('open'),
  program = require('commander'),
  path = require('path'),
  fs = require('fs'),
  transformCss = require('figma2css-module'),
  reload = require('reload'),
  watchFront = require('./watch-front')


const fetchProject = require('figmafetch-module');

const runServer = () => {
  app.use(express.json())
    .use(bodyParser.json())
    .use(express.static('public'));

  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/index.html'));
  });

  app.get('/data', async function (req, res) {
    // ?figmaAccessToken=[token]&fileId=[id]&nodeIds=1:36,1:24
    let id = req.query.fileId;
    let token = req.query.figmaAccessToken;
    let nodeIds = 
      req.query.nodeIds ? req.query.nodeIds.split(',') : []
    if(!id || !token) {
      res.status(500).send("user token and fileId needed!!!");
    }else{
      let figmaData = await fetchProject(id, token, nodeIds);
      figmaData['headers'] = { token: token, id: id };
      fs.writeFileSync('./data', JSON.stringify(figmaData, null, 2), 'utf-8');
      res.send(figmaData);
    }
  });

  app.get('/cached-credentials', async (req, res) => {
    try {
      let data = JSON.parse(fs.readFileSync('./data'));
      data = data['headers'];
      res.send(data);
    } catch (e) {}
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
    let data = await fs.readFileSync('./data', 'utf-8')
    data = JSON.parse(data)
    let ids = req.query.ids
    if(!ids) {
      res.send('ids empty!')
      return
    }
    ids = ids.split(',')
    let resultFilePath = req.query.filePath
    if(!resultFilePath) {
      res.send('resultPath empty!')
      return
    }
    let finalCss = ''
    for(let id of ids) {
      let element = findElement(data.document, id)
      finalCss += transformCss(element)
    }
    fs.writeFileSync(resultFilePath, finalCss, 'utf-8')
    res.send(finalCss);
  });

  reload(app).then(function (reloadReturned) {
    app.listen(4200, function () {
      console.log('Web server listening on port 4200!')
    })
  }).catch(function (err) {
    console.error('Reload could not start, could not start server/sample app', err)
  })
  //open('http://localhost:4200/')
};

program
  .description('run server!')
  .option('-d, --dev', 'devmod watch and reload')
  .action(async function(cmd) {
  console.log('devmod: ', cmd.dev)
  if(cmd.dev) 
    watchFront()  
  runServer()
});

program.parse(process.argv);
