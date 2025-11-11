#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APP_CONFIG_JS_PATH = path.join(__dirname, '..', 'app.config.js');
const APP_CONFIG_TS_PATH = path.join(__dirname, '..', 'app.config.ts');

/**
 * Parse the version string and increment the patch version
 * @param {string} version - Version in format "x.y.z"
 * @returns {string} Incremented version
 */
function incrementPatchVersion(version) {
  const parts = version.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${version}. Expected format: x.y.z`);
  }
  const [major, minor, patch] = parts;
  const newPatch = parseInt(patch, 10) + 1;
  return `${major}.${minor}.${newPatch}`;
}

/**
 * Read and parse the app config file
 * @param {string} filePath - Path to the config file
 * @returns {object} Parsed config data with file content
 */
function readConfigFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract current values using regex patterns
  const versionMatch = content.match(/version:\s*["']([^"']+)["']/);
  const buildNumberMatch = content.match(/buildNumber:\s*["']?(\d+)["']?/);
  const versionCodeMatch = content.match(/versionCode:\s*(\d+)/);
  
  if (!versionMatch || !buildNumberMatch || !versionCodeMatch) {
    throw new Error(`Could not parse version information from ${filePath}`);
  }
  
  return {
    content,
    version: versionMatch[1],
    buildNumber: buildNumberMatch[1],
    versionCode: parseInt(versionCodeMatch[1], 10)
  };
}

/**
 * Update the config file with new version values
 * @param {string} filePath - Path to the config file
 * @param {string} content - Original file content
 * @param {string} oldVersion - Old version string
 * @param {string} newVersion - New version string
 * @param {string} oldBuildNumber - Old iOS build number
 * @param {string} newBuildNumber - New iOS build number
 * @param {number} oldVersionCode - Old Android version code
 * @param {number} newVersionCode - New Android version code
 */
function updateConfigFile(
  filePath,
  content,
  oldVersion,
  newVersion,
  oldBuildNumber,
  newBuildNumber,
  oldVersionCode,
  newVersionCode
) {
  let updatedContent = content;
  
  // Update version
  updatedContent = updatedContent.replace(
    new RegExp(`version:\\s*["']${oldVersion}["']`),
    `version: "${newVersion}"`
  );
  
  // Update iOS buildNumber (handle both quoted and unquoted)
  updatedContent = updatedContent.replace(
    new RegExp(`buildNumber:\\s*["']?${oldBuildNumber}["']?`),
    `buildNumber: "${newBuildNumber}"`
  );
  
  // Update Android versionCode
  updatedContent = updatedContent.replace(
    new RegExp(`versionCode:\\s*${oldVersionCode}\\b`),
    `versionCode: ${newVersionCode}`
  );
  
  fs.writeFileSync(filePath, updatedContent, 'utf8');
}

/**
 * Attempt to commit the version bump to git
 * @param {string} newVersion - The new version string
 * @returns {boolean} Whether the commit was successful
 */
function commitVersionBump(newVersion) {
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    
    // Stage the config files
    execSync('git add app.config.js app.config.ts', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore'
    });
    
    // Commit with the version bump message
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore'
    });
    
    return true;
  } catch (error) {
    // Git not available or nothing to commit
    return false;
  }
}

/**
 * Main function to bump version
 */
function main() {
  try {
    console.log('🚀 Starting version bump...\n');
    
    // Read both config files to ensure they're in sync
    const jsConfig = readConfigFile(APP_CONFIG_JS_PATH);
    const tsConfig = readConfigFile(APP_CONFIG_TS_PATH);
    
    // Verify both files have the same version info
    if (
      jsConfig.version !== tsConfig.version ||
      jsConfig.buildNumber !== tsConfig.buildNumber ||
      jsConfig.versionCode !== tsConfig.versionCode
    ) {
      console.warn('⚠️  Warning: app.config.js and app.config.ts have different version values!');
      console.warn(`   JS: ${jsConfig.version} / ${jsConfig.buildNumber} / ${jsConfig.versionCode}`);
      console.warn(`   TS: ${tsConfig.version} / ${tsConfig.buildNumber} / ${tsConfig.versionCode}`);
      console.warn('   Proceeding with app.config.js values...\n');
    }
    
    // Use values from app.config.js (the primary config)
    const oldVersion = jsConfig.version;
    const oldBuildNumber = jsConfig.buildNumber;
    const oldVersionCode = jsConfig.versionCode;
    
    // Calculate new values
    const newVersion = incrementPatchVersion(oldVersion);
    const newBuildNumber = (parseInt(oldBuildNumber, 10) + 1).toString();
    const newVersionCode = oldVersionCode + 1;
    
    // Update both config files
    updateConfigFile(
      APP_CONFIG_JS_PATH,
      jsConfig.content,
      oldVersion,
      newVersion,
      oldBuildNumber,
      newBuildNumber,
      oldVersionCode,
      newVersionCode
    );
    
    updateConfigFile(
      APP_CONFIG_TS_PATH,
      tsConfig.content,
      oldVersion,
      newVersion,
      oldBuildNumber,
      newBuildNumber,
      oldVersionCode,
      newVersionCode
    );
    
    // Display success messages
    console.log(`✅ Version bumped: ${oldVersion} → ${newVersion}`);
    console.log(`✅ iOS buildNumber: ${oldBuildNumber} → ${newBuildNumber}`);
    console.log(`✅ Android versionCode: ${oldVersionCode} → ${newVersionCode}`);
    console.log('\n📝 Updated files:');
    console.log('   - app.config.js');
    console.log('   - app.config.ts');
    
    // Attempt to commit the changes
    const committed = commitVersionBump(newVersion);
    if (committed) {
      console.log('\n✅ Changes committed to git');
    } else {
      console.log('\n💡 Tip: Commit these changes with:');
      console.log(`   git add app.config.js app.config.ts`);
      console.log(`   git commit -m "chore: bump version to ${newVersion}"`);
    }
    
    console.log('\n🎉 Version bump complete!');
    console.log('\n📦 Next steps:');
    console.log('   npx eas build --platform ios');
    console.log('   npx eas submit --platform ios');
    
  } catch (error) {
    console.error('❌ Error bumping version:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { incrementPatchVersion, readConfigFile, updateConfigFile };
