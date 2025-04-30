// test-zk-connection.js
// Run directly with: bun test-zk-connection.js

// Try different libraries
let ZKLib;
try {
  ZKLib = require('node-zklib');
  console.log('Using node-zklib');
} catch (e) {
  try {
    ZKLib = require('zklib');
    console.log('Using zklib');
  } catch (e) {
    console.error('Error loading ZK libraries:', e);
    console.log('Please install required libraries:');
    console.log('bun add node-zklib zklib');
    process.exit(1);
  }
}

// Different device connection methods to try
const connectionTests = [
  {
    name: 'Simple connection with numeric ports',
    initFn: async () => {
      console.log('\nTesting simple connection with numeric ports...');
      const zk = new ZKLib({
        ip: '192.168.100.35',
        port: 4370,
        timeout: 5000
      });
      
      try {
        const connected = await zk.connect();
        console.log('Connection result:', connected);
        return { success: !!connected, instance: zk };
      } catch (err) {
        console.error('Connection error:', err);
        return { success: false, error: err };
      }
    }
  },
  {
    name: 'Direct parameter initialization',
    initFn: async () => {
      console.log('\nTesting direct parameter initialization...');
      const zk = new ZKLib('192.168.100.35', 4370, 5000);
      
      try {
        const connected = await zk.connect();
        console.log('Connection result:', connected);
        return { success: !!connected, instance: zk };
      } catch (err) {
        console.error('Connection error:', err);
        return { success: false, error: err };
      }
    }
  },
  {
    name: 'ZKLib with different initialization',
    initFn: async () => {
      console.log('\nTesting alternative initialization...');
      try {
        const zk = new ZKLib('192.168.100.35', 4370);
        console.log('ZK instance created');
        
        try {
          // For zklib
          if (typeof zk.connect === 'function' && zk.connect.length === 1) {
            // Callback-style connection
            return new Promise((resolve) => {
              zk.connect((err) => {
                if (err) {
                  console.error('Connection error:', err);
                  resolve({ success: false, error: err });
                } else {
                  console.log('Connected successfully');
                  resolve({ success: true, instance: zk });
                }
              });
            });
          } else {
            // Promise-style connection
            const connected = await zk.connect();
            console.log('Connection result:', connected);
            return { success: !!connected, instance: zk };
          }
        } catch (err) {
          console.error('Connection error:', err);
          return { success: false, error: err };
        }
      } catch (err) {
        console.error('Initialization error:', err);
        return { success: false, error: err };
      }
    }
  }
];

// Run the tests
async function runTests() {
  console.log('ZKTeco Connection Test');
  console.log('=====================');
  console.log('IP: 192.168.100.35, Port: 4370');
  
  let succeededTest = null;
  
  for (const test of connectionTests) {
    console.log(`\nRunning test: ${test.name}`);
    try {
      const result = await test.initFn();
      
      if (result.success) {
        console.log('✅ Test passed!');
        succeededTest = result;
        
        try {
          const instance = result.instance;
          console.log('Trying to get device info...');
          
          if (typeof instance.getInfo === 'function') {
            if (instance.getInfo.length === 1) {
              // Callback style
              await new Promise((resolve) => {
                instance.getInfo((err, info) => {
                  if (err) {
                    console.error('Error getting device info:', err);
                  } else {
                    console.log('Device info:', info);
                  }
                  resolve();
                });
              });
            } else {
              // Promise style
              const info = await instance.getInfo();
              console.log('Device info:', info);
            }
          } else {
            console.log('getInfo method not available');
          }
          
          // Try to disconnect
          try {
            if (typeof instance.disconnect === 'function') {
              await instance.disconnect();
              console.log('Disconnected successfully');
            }
          } catch (err) {
            console.error('Error disconnecting:', err);
          }
        } catch (infoErr) {
          console.error('Error getting device info:', infoErr);
        }
        
        // We found a working test, stop testing
        break;
      } else {
        console.log('❌ Test failed');
      }
    } catch (err) {
      console.error('Test error:', err);
    }
  }
  
  if (succeededTest) {
    console.log('\n✅ Connection Test Summary:');
    console.log('Successfully connected with:', succeededTest.name);
    console.log('Use this initialization method in your application');
  } else {
    console.log('\n❌ All connection tests failed');
    console.log('Please check:');
    console.log('1. ZKTeco device is powered on and connected to the network');
    console.log('2. The device has IP: 192.168.100.35 and port 4370 is open');
    console.log('3. No firewall is blocking the connection');
    console.log('4. You can ping the device from this machine');
    console.log('\nConsider using the CSV import method as a workaround');
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
});