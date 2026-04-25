const axios = require('axios');
(async () => {
  try {
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@crm.com',
      password: 'password'
    });
    const token = loginRes.data.token;
    console.log('Token:', token ? 'Yes' : 'No');

    const usersRes = await axios.get('http://localhost:5001/api/auth/users', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Users:', usersRes.data.length);
    
    const leadsRes = await axios.get('http://localhost:5001/api/leads', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Leads:', leadsRes.data.leads.length);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
})();
