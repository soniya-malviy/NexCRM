const http = require('http');

const req = http.request({
  hostname: 'localhost', port: 5001, path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, res => {
  let d = ''; res.on('data', c => d+=c);
  res.on('end', () => {
    const data = JSON.parse(d);
    if (!data.token) return console.log('Login failed:', data);
    
    http.request({
      hostname: 'localhost', port: 5001, path: '/api/leads', method: 'GET',
      headers: { 'Authorization': 'Bearer ' + data.token }
    }, res2 => {
      let d2 = ''; res2.on('data', c => d2+=c);
      res2.on('end', () => {
        const result = JSON.parse(d2);
        console.log('Priya Leads:', result.leads ? result.leads.map(l => l.name) : result);
      });
    }).end();
  });
});
req.write(JSON.stringify({ email: 'priya@gmail.com', password: 'password' })); // Assuming standard password
req.end();
