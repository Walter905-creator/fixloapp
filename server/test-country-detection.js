// Test country detection with multiple providers and fallback
const countryDetectionService = require('./utils/countryDetection');

async function testCountryDetection() {
  console.log('🧪 Testing Country Detection Service with Multiple Providers\n');
  
  // Test IPs from different countries
  const testIPs = [
    { ip: '8.8.8.8', expectedCountry: 'US', description: 'Google DNS (US)' },
    { ip: '1.1.1.1', expectedCountry: 'AU', description: 'Cloudflare DNS (Australia)' },
    { ip: '172.73.14.189', expectedCountry: 'Unknown', description: 'IP from error log' },
    { ip: '185.220.101.1', expectedCountry: 'DE', description: 'European IP (Germany)' },
  ];

  console.log('📋 Testing multiple providers with fallback...\n');
  
  for (const test of testIPs) {
    try {
      console.log(`\n🔍 Testing IP: ${test.ip} (${test.description})`);
      const result = await countryDetectionService.detectCountry(test.ip);
      
      console.log(`✅ Result:`, {
        country: result.countryName,
        code: result.countryCode,
        city: result.city || 'N/A',
        provider: result.provider || 'cached/default',
        supported: result.supported,
        fallback: result.fallback || false
      });
      
      // Wait a bit to avoid rate limiting during testing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error testing ${test.ip}:`, error.message);
    }
  }

  // Test caching
  console.log('\n\n📦 Testing cache functionality...');
  console.log('Making second request for first IP (should be cached)...');
  const cachedStart = Date.now();
  const cachedResult = await countryDetectionService.detectCountry(testIPs[0].ip);
  const cachedTime = Date.now() - cachedStart;
  console.log(`✅ Cached result retrieved in ${cachedTime}ms:`, {
    country: cachedResult.countryName,
    code: cachedResult.countryCode,
    provider: cachedResult.provider || 'cached'
  });

  // Test throttling
  console.log('\n\n⏱️ Testing throttling (rapid requests)...');
  const throttleIP = '8.8.8.8';
  
  // Clear cache to force new requests
  countryDetectionService.clearCache();
  
  console.log('Making 3 rapid requests for same IP...');
  for (let i = 1; i <= 3; i++) {
    console.log(`\nRequest ${i}:`);
    const result = await countryDetectionService.detectCountry(throttleIP);
    console.log(`  - Country: ${result.countryName}, Fallback: ${result.fallback || false}`);
  }

  // Get cache stats
  console.log('\n\n📊 Cache Statistics:');
  const stats = countryDetectionService.getCacheStats();
  console.log(stats);

  console.log('\n✅ All tests completed!');
  process.exit(0);
}

// Run tests
testCountryDetection().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
