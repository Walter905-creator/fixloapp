const { parseBuildMetadata, updateVersionJson } = require('./set-build-metadata');
const fs = require('fs');
const path = require('path');

// Test the build metadata system
function testBuildMetadataSystem() {
  console.log('🧪 Testing FIXLO BUILD metadata system...\n');
  
  // Test 1: Parse FIXLO BUILD format
  console.log('Test 1: Parsing FIXLO BUILD format');
  try {
    const testString = "FIXLO BUILD {BUILD_ID: '2025-08-16T22:19:50', COMMIT_SHA: '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde'}";
    const result = parseBuildMetadata(testString);
    
    const expected = {
      BUILD_ID: '2025-08-16T22:19:50',
      COMMIT_SHA: '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde'
    };
    
    if (JSON.stringify(result) === JSON.stringify(expected)) {
      console.log('✅ PASS: Parse FIXLO BUILD format');
    } else {
      console.log('❌ FAIL: Parse FIXLO BUILD format');
      console.log('Expected:', expected);
      console.log('Got:', result);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Parse FIXLO BUILD format - Error:', error.message);
    return false;
  }
  
  // Test 2: Update version.json files
  console.log('\nTest 2: Updating version.json files');
  try {
    const buildId = '2025-08-16T22:19:50';
    const commitSha = '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde';
    
    const version = updateVersionJson(buildId, commitSha);
    
    // Check if version object has required fields
    if (version.buildId === buildId && version.commitSha === commitSha && version.commit === commitSha) {
      console.log('✅ PASS: Update version.json files');
    } else {
      console.log('❌ FAIL: Update version.json files');
      console.log('Version object:', version);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Update version.json files - Error:', error.message);
    return false;
  }
  
  // Test 3: Verify files exist and contain correct data
  console.log('\nTest 3: Verifying file contents');
  try {
    const versionPath = path.join(__dirname, '..', 'version.json');
    const clientVersionPath = path.join(__dirname, '..', 'client', 'public', 'version.json');
    
    // Check root version.json
    if (fs.existsSync(versionPath)) {
      const rootVersion = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      if (rootVersion.buildId && rootVersion.commitSha) {
        console.log('✅ PASS: Root version.json has required fields');
      } else {
        console.log('❌ FAIL: Root version.json missing required fields');
        return false;
      }
    } else {
      console.log('❌ FAIL: Root version.json does not exist');
      return false;
    }
    
    // Check client version.json
    if (fs.existsSync(clientVersionPath)) {
      const clientVersion = JSON.parse(fs.readFileSync(clientVersionPath, 'utf8'));
      if (clientVersion.buildId && clientVersion.commitSha) {
        console.log('✅ PASS: Client version.json has required fields');
      } else {
        console.log('❌ FAIL: Client version.json missing required fields');
        return false;
      }
    } else {
      console.log('❌ FAIL: Client version.json does not exist');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Verify file contents - Error:', error.message);
    return false;
  }
  
  console.log('\n🎉 All tests passed! FIXLO BUILD metadata system is working correctly.');
  return true;
}

// Run tests if this script is executed directly
if (require.main === module) {
  const success = testBuildMetadataSystem();
  process.exit(success ? 0 : 1);
}

module.exports = { testBuildMetadataSystem };