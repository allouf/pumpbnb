// Quick API test script
const https = require('https');

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`   URL: https://pumpbnb-backend.onrender.com${path}`);

    https.get(`https://pumpbnb-backend.onrender.com${path}`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`   Response:`, JSON.stringify(json, null, 2));

          if (json.success === true || json.status === 'ok') {
            console.log(`   ✅ PASSED`);
          } else {
            console.log(`   ❌ FAILED`);
          }
        } catch (e) {
          console.log(`   Raw response:`, data);
          console.log(`   ❌ FAILED - Invalid JSON`);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`   ❌ ERROR: ${err.message}`);
      resolve();
    });
  });
}

async function runTests() {
  console.log('================================');
  console.log('Backend API Tests');
  console.log('================================');

  await testEndpoint('/health', 'Health Check');
  await testEndpoint('/api/tokens', 'Get All Tokens');
  await testEndpoint('/api/tokens/trending', 'Get Trending Tokens');
  await testEndpoint('/api/tokens/recent', 'Get Recent Tokens');

  console.log('\n================================');
  console.log('Tests Complete!');
  console.log('================================\n');
}

runTests();
