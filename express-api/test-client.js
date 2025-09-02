const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001';

class ItemsAPIClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🚀 ${config.method || 'GET'} ${url}`);
      if (config.body) {
        console.log('📤 Request body:', config.body);
      }

      const response = await fetch(url, config);
      const data = await response.json();

      console.log(`📡 Status: ${response.status}`);
      console.log('📥 Response:', JSON.stringify(data, null, 2));
      console.log('---');

      return { data, status: response.status, ok: response.ok };
    } catch (error) {
      console.error('❌ Request failed:', error.message);
      return { error: error.message, status: 0, ok: false };
    }
  }

  async healthCheck() {
    return this.request('/health');
  }

  async getAllItems(queryParams = {}) {
    const params = new URLSearchParams(queryParams);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/items${query}`);
  }

  async getItemById(id) {
    return this.request(`/items/${id}`);
  }

  async createItem(itemData) {
    return this.request('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }
}

// Test scenarios
async function runTests() {
  console.log('🧪 Starting API Tests...\n');

  const client = new ItemsAPIClient();

  try {
    // 1. Health check
    console.log('1️⃣ Testing health endpoint...');
    await client.healthCheck();

    // 2. Get all items
    console.log('2️⃣ Getting all items...');
    await client.getAllItems();

    // 3. Create a new item
    console.log('3️⃣ Creating a new item...');
    const newItem = {
      name: 'Test Item from Client',
      description: 'This item was created by the test client'
    };
    const createResult = await client.createItem(newItem);

    // 4. Get specific item by ID (using the created item's ID if successful)
    if (createResult.ok && createResult.data.success) {
      const itemId = createResult.data.data.id;
      console.log(`4️⃣ Getting item by ID (${itemId})...`);
      await client.getItemById(itemId);
    }

    // 5. Test search functionality
    console.log('5️⃣ Testing search functionality...');
    await client.getAllItems({ search: 'sample' });

    // 6. Test pagination
    console.log('6️⃣ Testing pagination (limit=1)...');
    await client.getAllItems({ limit: 1 });

    // 7. Test error scenarios
    console.log('7️⃣ Testing error scenarios...');

    // Invalid item creation (missing name)
    console.log('   📝 Testing invalid item creation...');
    await client.createItem({ description: 'No name provided' });

    // Non-existent item retrieval
    console.log('   📝 Testing non-existent item retrieval...');
    await client.getItemById(99999);

    // 8. Create another item with duplicate name to test conflict
    console.log('8️⃣ Testing duplicate name conflict...');
    await client.createItem({
      name: 'Sample Item 1', // This should already exist
      description: 'Trying to create duplicate'
    });

    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Helper function to test concurrent requests
async function testConcurrentRequests() {
  console.log('\n🔄 Testing concurrent requests...');

  const client = new ItemsAPIClient();

  const promises = [
    client.getAllItems(),
    client.createItem({ name: 'Concurrent Item 1', description: 'Created concurrently' }),
    client.createItem({ name: 'Concurrent Item 2', description: 'Created concurrently' }),
    client.healthCheck(),
  ];

  try {
    await Promise.all(promises);
    console.log('✅ Concurrent requests completed successfully!');
  } catch (error) {
    console.error('❌ Concurrent requests failed:', error);
  }
}

// Performance test
async function performanceTest(iterations = 10) {
  console.log(`\n⚡ Running performance test (${iterations} requests)...`);

  const client = new ItemsAPIClient();
  const startTime = Date.now();

  const promises = [];
  for (let i = 0; i < iterations; i++) {
    promises.push(client.getAllItems());
  }

  try {
    await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(`📊 Performance Results:`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Average time per request: ${avgTime.toFixed(2)}ms`);
    console.log(`   Requests per second: ${(1000 / avgTime).toFixed(2)}`);
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
}

// Main execution
async function main() {
  console.log('🌟 Items API Test Client');
  console.log('=========================\n');

  // Check if server is running
  const client = new ItemsAPIClient();
  const healthCheck = await client.healthCheck();

  if (!healthCheck.ok) {
    console.error('❌ Server is not running! Please start the Express server first:');
    console.error('   cd express-api && npm start');
    process.exit(1);
  }

  // Run all tests
  await runTests();
  await testConcurrentRequests();
  await performanceTest(5);

  console.log('\n🎉 Test client execution completed!');
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Items API Test Client

Usage: node test-client.js [options]

Options:
  --help, -h     Show this help message
  --perf [n]     Run performance test with n iterations (default: 10)
  --concurrent   Run only concurrent tests
  --basic        Run only basic tests

Examples:
  node test-client.js                    # Run all tests
  node test-client.js --perf 20          # Run performance test with 20 iterations
  node test-client.js --concurrent       # Run only concurrent tests
  node test-client.js --basic            # Run only basic CRUD tests
    `);
    process.exit(0);
  }

  if (args.includes('--perf')) {
    const perfIndex = args.indexOf('--perf');
    const iterations = args[perfIndex + 1] ? parseInt(args[perfIndex + 1]) : 10;
    performanceTest(iterations).then(() => process.exit(0));
  } else if (args.includes('--concurrent')) {
    testConcurrentRequests().then(() => process.exit(0));
  } else if (args.includes('--basic')) {
    runTests().then(() => process.exit(0));
  } else {
    main().catch(console.error);
  }
}

module.exports = { ItemsAPIClient };
