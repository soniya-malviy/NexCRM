const http = require('http');

const login = () => {
  const req = http.request({
    hostname: 'localhost', port: 5001, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, res => {
    let d = ''; res.on('data', c => d+=c);
    res.on('end', () => {
      const { token } = JSON.parse(d);
      
      http.request({
        hostname: 'localhost', port: 5001, path: '/api/leads', method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      }, res2 => {
        let d2 = ''; res2.on('data', c => d2+=c);
        res2.on('end', () => console.log('Priya Leads:', JSON.parse(d2).leads.map(l => l.name)));
      }).end();
    });
  });
  req.write(JSON.stringify({ email: 'priya@gmail.com', password: 'password' })); // Assuming password is password, or Soniya set it.
  req.end();
}
login();
