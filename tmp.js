let arr = [1, 2, 3, 4, 5]

let result = null
for(let item of arr) {
  if(item === 3) {
    result = item
    break
  }
}

console.log('result: ', result)
