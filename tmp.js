const fs = require('fs')

let data = fs.readFileSync('./file-data', 'utf-8')
data = JSON.parse(data)
let treeString = `<ul>`
let pages = data.document.children
let generateTreeview = (node) => {
  treeString += `<li>${node.name}`
  if(node.children) {
    treeString += `<ul>`
    for(let child of node.children) {
      console.log('child: ', child)
      generateTreeviewRecursive(child)
    }
    treeString += `</ul>`
  }
  treeString += `</li>`
  return
}
for(let page of pages) {
  generateTreeviewRecursive(page)
}
treeString += `</ul>`
console.log('>>>>>>>> ', treeString)
