// test-connection.js
const ZKLib = require('zklib');

const zk = new ZKLib({
  ip: '192.168.100.35',
  port: 4370,
  timeout: 10000,  // Longer timeout for testing
  inport: 4370
});

console.log('Attempting to connect to device...');

zk.connect((err) => {
  if (err) {
    console.error('Connection error:', err);
    zk.disconnect();
    return;
  }
  
  console.log('Successfully connected to device');
  
  // Try to get users
  zk.getUser((err, users) => {
    if (err) {
      console.error('Error getting users:', err);
    } else {
      console.log('Retrieved users successfully:', users ? users.length : 0);
      console.log('First few users:', users ? users.slice(0, 3) : 'none');
    }
    
    zk.disconnect();
  });
});