#!/usr/bin/env node

const express = require('express'),
  app = express(),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  open = require('open'),
  path = require('path'),
  fs = require('fs'),
  transformCss = require('figma2css-module'),
  reload = require('reload');


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
    let { fileId, figmaToken, writeData } = req.query;
    let nodeIds =
      req.query.nodeIds ? req.query.nodeIds.split(',') : [];
    let depth = req.query.depth
    if(!fileId || !figmaToken) {
      res.status(500).send("user token and fileId needed!!!");
    } else {
      let figmaData = await fetchProject(fileId, figmaToken, nodeIds, depth);
      figmaData['headers'] = { figmaToken: figmaToken, fileId: fileId };
      if(writeData === 'true') {
        fs.writeFileSync('./data', JSON.stringify(figmaData, null, 2), 'utf-8');
      }
      res.send(figmaData);
    }
  });

  const readFileData = () => {
    try {
      let data = JSON.parse(fs.readFileSync('./data'));
      return data;
    } catch (e) {
      console.error('error when reading file data!: ', e);
      return {};
    }
  }

  const findNodes = (ids, data) => {
    let nodes = [];
    for(let child of data.children) {
      if(ids.includes(child.id)) {
        nodes.push(child);   
      }
      
      if(child.children && child.children.length) {
        nodes = nodes.concat(findNodes(ids, child));
      }
    } 
    return nodes;
  }

  app.get('/cached-credentials', async (req, res) => {
    let data = readFileData();
    console.log('after readData')
    if(data.headers) {
      data = data['headers'];
      res.send(data);
    } else {
      res.status(404).send('no cached data');
    }
  });

  app.post('/css', async function (req, res) {
    // ?filePath=/home/mmc/docs/test.css
    const resultFilePath = req.query.filePath
    const ids = req.body.ids

    if(!ids) {
      res.status(400).send('No ids were selected!')
      return
    }
    let data = readFileData();
    let nodes = findNodes(ids, data.document);
    let finalCss = ''
    nodes.forEach((node) => {
      let resultCss = transformCss(node);
      if(resultCss) 
        finalCss += resultCss
    });
    if(resultFilePath) {
      try {
        fs.writeFileSync(resultFilePath, finalCss, 'utf-8')
      } catch(err) { 
        res.status(400).send(err)
        console.error(err)
        return 
      }
    }
    finalCss = finalCss ? finalCss : 'No css styles found in the object' 
    res.send(finalCss)
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

runServer();
