#!/usr/bin/env node

const express = require('express'),
  app = express(),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  open = require('open'),
  program = require('commander'),
  path = require('path'),
  fs = require('fs'),
  transformCss = require('figma2css-module'),
  reload = require('reload'),
  watchFront = require('./watch-front'),
  transformCssAlternative = require('./transformCssAlternative')


const fetchProject = require('figmafetch-module');

const runServer = () => {
  app.use(express.json())
    .use(cors({ credentials: true, origin: ['http://localhost:5000']}))
    .use(bodyParser.json())
    .use(express.static('public'));

  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/public/index.html'));
  });

  app.get('/data', async function (req, res) {
    // ?figmaToken=[token]&fileId=[id]&nodeIds=1:36,1:24&depth=1
    let id = req.query.fileId;
    let token = req.query.figmaToken;
    let nodeIds =
      req.query.nodeIds ? req.query.nodeIds.split(',') : [];
    let depth = req.query.depth
    if(!id || !token) {
      res.status(500).send("user token and fileId needed!!!");
    }else{
      let figmaData = await fetchProject(id, token, nodeIds, depth);
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

  app.get('/css', async function (req, res) {
    // ?figmaToken=[token]&fileId=[id]&nodeIds=1:36,1:24&depth=1
    const id = req.query.fileId,
      token = req.query.figmaToken,
      cssAttributes = req.query.cssAttributes ? req.query.cssAttributes.split(",") : [],
      nodeIds = req.query.nodeIds ? req.query.nodeIds.split(',') : [],
      resultFilePath = req.query.filePath

    if(cssAttributes.length === 0) {
      res.send('no css attribute selected to be generated!');
      return;
    }

    const data = await fetchProject(id, token, nodeIds);
    if(!data) {
      res.send('no data was found!')
      return
    }
    if(!data.nodes) {
      res.send('invalid data!')
      return
    }
    if(!resultFilePath) {
      res.send('resultPath empty!')
      return
    }
    let finalCss = ''
    Object.keys(data.nodes).forEach((key) => {
      finalCss += transformCssAlternative(data.nodes[key].document, cssAttributes);
    })
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
    if(cmd.dev)
      watchFront()
    runServer()
  });

program.parse(process.argv);
