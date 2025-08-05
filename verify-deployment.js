#!/usr/bin/env node
/**
 * Deployment Verification Script
 * Checks if Vercel deployment is working correctly
 */

const https = require('https');
const fs = require('fs');

const DEPLOYMENT_URL = 'https://www.fixloapp.com';
const BUILD_INFO_FILE = './client/build/index.html';

console.log('🔍 Verifying Fixlo deployment...\n');

// Function to make HTTP request
function checkDeployment(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to get local build info
function getLocalBuildInfo() {
  try {
    if (fs.existsSync(BUILD_INFO_FILE)) {
      const content = fs.readFileSync(BUILD_INFO_FILE, 'utf8');
      
      // Extract build timestamp and build ID
      const timestampMatch = content.match(/name="build-timestamp" content="([^"]+)"/);
      const buildIdMatch = content.match(/name="build-id" content="([^"]+)"/);
      const jsFileMatch = content.match(/src="\/static\/js\/(main\.[a-f0-9]+\.js)"/);
      
      return {
        timestamp: timestampMatch ? timestampMatch[1] : 'not found',
        buildId: buildIdMatch ? buildIdMatch[1] : 'not found',
        jsFile: jsFileMatch ? jsFileMatch[1] : 'not found'
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Function to extract deployment info from response
function getDeploymentInfo(body) {
  const timestampMatch = body.match(/name="build-timestamp" content="([^"]+)"/);
  const buildIdMatch = body.match(/name="build-id" content="([^"]+)"/);
  const jsFileMatch = body.match(/src="\/static\/js\/(main\.[a-f0-9]+\.js)"/);
  const titleMatch = body.match(/<title>([^<]+)<\/title>/);
  
  return {
    timestamp: timestampMatch ? timestampMatch[1] : 'not found',
    buildId: buildIdMatch ? buildIdMatch[1] : 'not found',
    jsFile: jsFileMatch ? jsFileMatch[1] : 'not found',
    title: titleMatch ? titleMatch[1] : 'not found'
  };
}

async function main() {
  try {
    // Get local build info
    const localBuild = getLocalBuildInfo();
    console.log('📦 Local Build Info:');
    if (localBuild) {
      console.log(`   Timestamp: ${localBuild.timestamp}`);
      console.log(`   Build ID: ${localBuild.buildId}`);
      console.log(`   JS File: ${localBuild.jsFile}`);
    } else {
      console.log('   ⚠️ No local build found - run "npm run build" first');
    }
    console.log('');
    
    // Check deployment
    console.log(`🌐 Checking deployment at: ${DEPLOYMENT_URL}`);
    const response = await checkDeployment(DEPLOYMENT_URL);
    
    console.log(`📊 Response Status: ${response.statusCode}`);
    console.log(`📊 Cache Control: ${response.headers['cache-control'] || 'not set'}`);
    console.log('');
    
    if (response.statusCode === 200) {
      const deploymentInfo = getDeploymentInfo(response.body);
      
      console.log('🚀 Deployed Build Info:');
      console.log(`   Timestamp: ${deploymentInfo.timestamp}`);
      console.log(`   Build ID: ${deploymentInfo.buildId}`);
      console.log(`   JS File: ${deploymentInfo.jsFile}`);
      console.log(`   Title: ${deploymentInfo.title}`);
      console.log('');
      
      // Compare local vs deployed
      if (localBuild && deploymentInfo) {
        console.log('🔄 Build Comparison:');
        const timestampMatch = localBuild.timestamp === deploymentInfo.timestamp;
        const buildIdMatch = localBuild.buildId === deploymentInfo.buildId;
        const jsFileMatch = localBuild.jsFile === deploymentInfo.jsFile;
        
        console.log(`   Timestamp Match: ${timestampMatch ? '✅' : '❌'} ${timestampMatch ? '' : `(local: ${localBuild.timestamp}, deployed: ${deploymentInfo.timestamp})`}`);
        console.log(`   Build ID Match: ${buildIdMatch ? '✅' : '❌'} ${buildIdMatch ? '' : `(local: ${localBuild.buildId}, deployed: ${deploymentInfo.buildId})`}`);
        console.log(`   JS File Match: ${jsFileMatch ? '✅' : '❌'} ${jsFileMatch ? '' : `(local: ${localBuild.jsFile}, deployed: ${deploymentInfo.jsFile})`}`);
        
        if (timestampMatch && buildIdMatch && jsFileMatch) {
          console.log('\n🎉 SUCCESS: Deployment is up to date with local build!');
        } else {
          console.log('\n⚠️ WARNING: Deployment appears to be out of sync with local build');
          console.log('   This could mean:');
          console.log('   - Vercel is still building/deploying');
          console.log('   - Cache issues preventing updates');
          console.log('   - Build configuration problems');
        }
      }
      
      // Check if React app is working
      if (response.body.includes('id="root"') && response.body.includes('Fixlo')) {
        console.log('\n✅ React app structure detected in response');
      } else {
        console.log('\n❌ React app structure not found in response');
      }
      
    } else {
      console.log(`❌ Deployment check failed with status: ${response.statusCode}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking deployment:', error.message);
  }
}

main();