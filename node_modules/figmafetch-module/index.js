const fetch = require('node-fetch');
const headers = new fetch.Headers();

const baseUrl = 'https://api.figma.com';

module.exports = async function fetchProject(projectId, token) {
  headers.set('X-Figma-Token', token);
  let resp = await fetch(`${baseUrl}/v1/files/${projectId}`, 
    {headers});
  let data = await resp.json();
  return data;
}
