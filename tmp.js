const fs = require('fs')

if(fs.existsSync('/home/mmc/tmp.css')) {
  console.log('file exists!')
} else {
  try {
    fs.writeFileSync('/home/mmc/tmp.css', '', 'utf-8')
  }catch(err) { console.error(err)}
  console.log('file doesnt exist' )
}

