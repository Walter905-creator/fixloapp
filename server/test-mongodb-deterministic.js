/**
 * Test: Deterministic MongoDB Connection Behavior
 * 
 * This test verifies that the server correctly handles MongoDB connection states:
 * 1. Server exits when MONGO_URI is missing
 * 2. Server exits when MONGO_URI is malformed
 * 3. Server exits when MongoDB is unreachable
 * 4. Server does NOT fall back to DB-less mode
 */

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'index.js');

function runServerTest(env, description) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${description}`);
    console.log('='.repeat(80));
    
    const serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, ...env },
      cwd: __dirname
    });

    let stdout = '';
    let stderr = '';

    serverProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    serverProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Set timeout to kill process after 15 seconds
    const timeout = setTimeout(() => {
      serverProcess.kill('SIGTERM');
    }, 15000);

    serverProcess.on('exit', (code) => {
      clearTimeout(timeout);
      
      const output = stdout + stderr;
      
      console.log(`Exit code: ${code}`);
      console.log('\nRelevant output:');
      
      // Extract key lines
      const keyLines = output.split('\n').filter(line => 
        line.includes('MONGO_URI') ||
        line.includes('MONGODB CONNECTION') ||
        line.includes('Connecting to Mongo') ||
        line.includes('MongoDB CONNECTED') ||
        line.includes('MongoDB FAILED') ||
        line.includes('Server startup') ||
        line.includes('FATAL') ||
        line.includes('DB-less') ||
        line.includes('Fixlo API listening')
      );
      
      keyLines.forEach(line => console.log(line));
      
      resolve({
        code,
        output,
        stdout,
        stderr
      });
    });
  });
}

async function runTests() {
  console.log('\n' + '#'.repeat(80));
  console.log('# MongoDB Connection Determinism Tests');
  console.log('#'.repeat(80));

  // Test 1: No MONGO_URI
  const test1 = await runServerTest(
    { MONGO_URI: undefined },
    'Server should exit when MONGO_URI is missing'
  );
  
  if (test1.code === 1 && test1.output.includes('MONGO_URI is missing')) {
    console.log('✅ PASS: Server correctly exits without MONGO_URI');
  } else {
    console.log('❌ FAIL: Server did not exit properly without MONGO_URI');
  }

  // Test 2: Malformed MONGO_URI
  const test2 = await runServerTest(
    { MONGO_URI: 'invalid-uri' },
    'Server should exit when MONGO_URI is malformed'
  );
  
  if (test2.code === 1 && test2.output.includes('MALFORMED URI')) {
    console.log('✅ PASS: Server correctly exits with malformed MONGO_URI');
  } else {
    console.log('❌ FAIL: Server did not exit properly with malformed MONGO_URI');
  }

  // Test 3: Unreachable MongoDB
  const test3 = await runServerTest(
    { MONGO_URI: 'mongodb://192.0.2.1:27017/test' },
    'Server should exit when MongoDB is unreachable'
  );
  
  if (test3.code === 1 && 
      test3.output.includes('Connecting to Mongo') &&
      test3.output.includes('MongoDB FAILED')) {
    console.log('✅ PASS: Server correctly exits when MongoDB is unreachable');
  } else {
    console.log('❌ FAIL: Server did not exit properly when MongoDB is unreachable');
  }

  // Test 4: Check for DB-less mode
  const allOutput = test1.output + test2.output + test3.output;
  if (!allOutput.includes('DB-less mode') && !allOutput.includes('without database')) {
    console.log('✅ PASS: No DB-less mode detected');
  } else {
    console.log('❌ FAIL: DB-less mode still exists');
  }

  console.log('\n' + '#'.repeat(80));
  console.log('# Test Summary');
  console.log('#'.repeat(80));
  console.log('All tests verify that the server fails to start without a valid MongoDB connection.');
  console.log('No silent fallback or DB-less mode should be possible.');
}

runTests().catch(console.error);
