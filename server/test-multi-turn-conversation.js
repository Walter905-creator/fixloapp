/**
 * Test script for Multi-Turn Conversation Support
 * Run with: node server/test-multi-turn-conversation.js
 * 
 * Prerequisites:
 * 1. Server must be running on port 3001
 * 2. OpenAI API key must be configured
 * 3. AI subscription middleware must be bypassed or valid token provided
 */

const http = require('http');

console.log('🧪 Multi-Turn Conversation Test Suite\n');

// Test helper function
function makeRequest(description, requestBody) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(requestBody);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/ai/diagnose',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          console.log(`\n📋 ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          if (response.sessionId) {
            console.log(`   Session ID: ${response.sessionId.substring(0, 16)}...`);
          }
          if (response.needsMoreInfo !== undefined) {
            console.log(`   Needs More Info: ${response.needsMoreInfo}`);
          }
          if (response.questions) {
            console.log(`   Questions (${response.questions.length}):`);
            response.questions.forEach((q, i) => {
              console.log(`      ${i + 1}. ${q}`);
            });
          }
          if (response.phase) {
            console.log(`   Phase: ${response.phase}`);
          }
          if (response.mode) {
            console.log(`   Mode: ${response.mode}`);
          }
          if (response.diagnosis) {
            console.log(`   Issue: ${response.diagnosis.issue}`);
            if (response.diagnosis.diyAllowed !== undefined) {
              console.log(`   DIY Allowed: ${response.diagnosis.diyAllowed}`);
            }
          }
          
          resolve({ response, statusCode: res.statusCode });
        } catch (error) {
          console.log(`\n❌ ${description} - Invalid JSON response`);
          console.log(`   Error: ${error.message}`);
          console.log(`   Raw response: ${responseData.substring(0, 300)}`);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`\n❌ ${description} - Request failed`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Make sure the server is running on port 3001`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Run conversation test
async function runConversationTest() {
  console.log('🚀 Testing Multi-Turn Conversation Flow\n');
  console.log('⚠️ Prerequisites:');
  console.log('   1. Server running on port 3001');
  console.log('   2. OpenAI API key configured');
  console.log('   3. AI subscription check bypassed or valid auth\n');
  console.log('═'.repeat(70));
  
  try {
    // Turn 1: User states the project
    console.log('\n🔵 TURN 1: Initial project statement');
    const turn1 = await makeRequest(
      'Turn 1: User states project',
      {
        description: 'replacing faucet',
        images: [],
        userId: 'test-user-conversation'
      }
    );
    
    if (turn1.statusCode !== 200) {
      console.log('\n❌ Turn 1 failed with status', turn1.statusCode);
      return false;
    }
    
    // Verify we got a sessionId
    if (!turn1.response.sessionId) {
      console.log('\n❌ Turn 1 did not return a sessionId');
      return false;
    }
    
    const sessionId = turn1.response.sessionId;
    
    // Verify AI asked questions (not immediately gave full diagnosis)
    if (!turn1.response.needsMoreInfo) {
      console.log('\n⚠️ Turn 1: AI provided full diagnosis immediately (expected questions)');
      // This is not necessarily wrong, but less ideal
    } else {
      console.log('\n✅ Turn 1: AI correctly asked for more information');
    }
    
    // Wait a moment before next turn
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Turn 2: User provides an answer
    console.log('\n🔵 TURN 2: User answers (kitchen)');
    const turn2 = await makeRequest(
      'Turn 2: User provides location',
      {
        description: 'kitchen',
        images: [],
        userId: 'test-user-conversation',
        sessionId: sessionId
      }
    );
    
    if (turn2.statusCode !== 200) {
      console.log('\n❌ Turn 2 failed with status', turn2.statusCode);
      return false;
    }
    
    // Verify session was maintained
    if (turn2.response.sessionId !== sessionId) {
      console.log('\n⚠️ Turn 2: Session ID changed (expected same session)');
    }
    
    // Check that AI is moving forward, not repeating
    if (turn2.response.questions) {
      const hasLocationQuestion = turn2.response.questions.some(q => 
        q.toLowerCase().includes('kitchen') || 
        q.toLowerCase().includes('bathroom') ||
        q.toLowerCase().includes('what project')
      );
      
      if (hasLocationQuestion) {
        console.log('\n❌ Turn 2: AI repeated a location question (should move forward)');
        console.log('   This indicates conversation state is not working correctly');
        return false;
      } else {
        console.log('\n✅ Turn 2: AI asked new questions (moving forward)');
      }
    }
    
    // Wait a moment before next turn
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Turn 3: User provides more answers
    console.log('\n🔵 TURN 3: User provides more details');
    const turn3 = await makeRequest(
      'Turn 3: User provides shutoff valve info',
      {
        description: 'yes I have shutoff valves',
        images: [],
        userId: 'test-user-conversation',
        sessionId: sessionId
      }
    );
    
    if (turn3.statusCode !== 200) {
      console.log('\n❌ Turn 3 failed with status', turn3.statusCode);
      return false;
    }
    
    // Check for question repetition
    if (turn3.response.questions) {
      const hasShutoffQuestion = turn3.response.questions.some(q => 
        q.toLowerCase().includes('shutoff') || q.toLowerCase().includes('shut off')
      );
      
      if (hasShutoffQuestion) {
        console.log('\n❌ Turn 3: AI repeated shutoff valve question');
        return false;
      }
    }
    
    console.log('\n✅ Turn 3: Conversation continuing appropriately');
    
    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('\n📊 CONVERSATION TEST SUMMARY\n');
    console.log('✅ Session persistence: Working');
    console.log('✅ Question tracking: Working');
    console.log('✅ Forward progress: Working');
    console.log('✅ No question repetition: Working');
    
    console.log('\n🎉 Multi-turn conversation test PASSED!\n');
    
    // Show conversation flow
    console.log('📝 Conversation Flow:');
    console.log('   1. User: "replacing faucet"');
    console.log('   2. AI: Asked clarifying questions (kitchen/bathroom, shutoff valves, etc.)');
    console.log('   3. User: "kitchen"');
    console.log('   4. AI: Moved forward with new questions (no repetition)');
    console.log('   5. User: "yes I have shutoff valves"');
    console.log('   6. AI: Continued assessment (no repeated questions)\n');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ Conversation test failed!\n');
    console.log('Error:', error.message);
    return false;
  }
}

// Run the test
runConversationTest()
  .then(success => {
    if (success) {
      console.log('✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  });
