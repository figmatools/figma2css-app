const fetchProject = require('./index')
let id = 'YZkG7swHVcXXJ6gA5PfLuNzw'
let token = '12606-e447b778-09cc-4bd3-91e8-843146de402d';
(async () => {
  let data = await fetchProject(id, token);
    data = data;
    data['headers'] = { token: token, id: id };
    console.log(JSON.stringify(data));
  console.log(JSON.stringify(data));
})()

