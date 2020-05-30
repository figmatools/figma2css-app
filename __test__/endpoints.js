const assert = require('assert')
const figmaToken = '46436-c6600cfa-6adf-4031-9e2a-ba1449a6dd6c',
  fileId = 'SGzkSxkP3pnZQrh9pzn6mf',
  http = require('http')

const fs = require('fs')

const tests = {
  getFile: async () => {
    const testUrl = `http://localhost:4200/data?figmaToken=${figmaToken}&fileId=${fileId}`
    http.get(testUrl, (resp) => {
      let data = ''
      resp.on('data', (chunk) => {
        data += chunk;
      })
      resp.on('end', () => {
        try {
          assert.equal(JSON.parse(data).document.id, '0:0', 'get whole file data')
        }catch(err) { console.error(err) }
      })
    }).on("error", (err) => {
      console.log("Error: " + err.message)
    })
  },
  getNodes: async () => {
    const testUrl = `http://localhost:4200/data?figmaToken=${figmaToken}&fileId=${fileId}&nodeIds=1:14,1:15`;
    return new Promise((resolve, reject) => {
      http.get(testUrl, (resp) => {
        let data = ''
        resp.on('data', (chunk) => {
          data += chunk;
        })
        resp.on('end', () => {
          try {
            assert.ok(JSON.parse(data).nodes['1:14'], 'get node 1:14')
            assert.ok(JSON.parse(data).nodes['1:15'], 'get node 1:15')
          }catch(err) { console.error(err) }
          resolve()
        })
      }).on("error", (err) => {
        console.log("Error: " + err.message)
        reject()
      })  
    });
  },
  getFileDepth: async () => {
    const testUrl = `http://localhost:4200/data?figmaToken=${figmaToken}&fileId=${fileId}&depth=1`
    http.get(testUrl, (resp) => {
      let data = ''
      resp.on('data', (chunk) => {
        data += chunk;
      })
      resp.on('end', () => {
        try {
          assert.equal(JSON.parse(data).document.children[0].children, 0, 'get file with depth 1')
        }catch(err) { console.error(err) }
      })
    }).on("error", (err) => {
      console.log("Error: " + err.message)
    })
  },
  generateCss: async () => {
    await tests.getNodes()
    const testUrl = `http://localhost:4200/css?ids=1:14,1:15&filePath=test.css`
    http.get(testUrl, (resp) => {
      let data = ''
      resp.on('data', (chunk) => {
        data += chunk;
      })
      resp.on('end', () => {
        try {
          console.log('data: ', data)
          assert.ok(data.match(/\.button/), 'generate some css')
        }catch(err) { console.error(err) }
      })
    }).on("error", (err) => {
      console.log("Error: " + err.message)
    })
  } 
}

const runTest = async () =>  {
  if(process.argv[2]) 
    tests[process.argv[2]]()
  else 
    Object.keys(tests).forEach((key) => tests[key]())
}

runTest()
