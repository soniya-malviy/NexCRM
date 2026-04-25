const http = require('http');

const optionsLogin = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const reqLogin = http.request(optionsLogin, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const { token } = JSON.parse(data);
    
    const optionsUsers = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/users',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    };
    
    http.request(optionsUsers, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => console.log('Users Response:', data2));
    }).end();
  });
});
reqLogin.write(JSON.stringify({ email: 'admin@crm.com', password: 'password' }));
reqLogin.end();
