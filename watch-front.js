const fs = require('fs')
const { exec } = require('child_process');

module.exports = () => {
  fs.watch('./svelte-components/src', (eventType, filename) => {
    const ls = exec('npm run build', 
      function (error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
        console.log('Error when trying to build!')
      }
      console.log('STDOUT: '+stdout);
      console.log('STDERR: '+stderr);
    })
  })
} 

