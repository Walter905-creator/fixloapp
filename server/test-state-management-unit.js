/**
 * Unit test for Multi-Turn State Management
 * Tests the in-memory state store without requiring server or OpenAI
 * Run with: node server/test-state-management-unit.js
 */

console.log('🧪 Multi-Turn State Management Unit Tests\n');

// Import state management functions from ai.js
// We'll test them in isolation
const crypto = require("crypto");

// Replicate the state management logic for testing
const projectStateStore = new Map();

function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

function updateProjectState(sessionId, updates, userId = null) {
  const MAX_SESSIONS = 10000;
  const MAX_CONVERSATION_HISTORY = 20;
  
  // Check session limit to prevent memory exhaustion
  if (!projectStateStore.has(sessionId) && projectStateStore.size >= MAX_SESSIONS) {
    // Evict oldest session (simple FIFO)
    const oldestSession = projectStateStore.keys().next().value;
    projectStateStore.delete(oldestSession);
    console.log(`⚠️ Session limit reached, evicted oldest session`);
  }
  
  const existingState = projectStateStore.get(sessionId) || {
    task: null,
    confirmedValues: {},
    questionsAsked: [],
    phase: 'ASSESSMENT',
    conversationHistory: [],
    userId: userId,
    createdAt: Date.now(),
    lastUpdated: Date.now()
  };

  // Helper for deep merge
  function deepMerge(target, source) {
    const output = { ...target };
    
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }

  // Deep merge for nested objects like confirmedValues
  const updatedState = {
    ...existingState,
    ...updates,
    confirmedValues: deepMerge(existingState.confirmedValues, updates.confirmedValues || {}),
    lastUpdated: Date.now()
  };
  
  // Limit conversation history length to prevent unbounded growth
  if (updatedState.conversationHistory && updatedState.conversationHistory.length > MAX_CONVERSATION_HISTORY) {
    updatedState.conversationHistory = updatedState.conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
  }

  projectStateStore.set(sessionId, updatedState);
  return updatedState;
}

function getProjectState(sessionId) {
  return projectStateStore.get(sessionId) || null;
}

function serializeProjectState(state) {
  if (!state) return null;
  
  return {
    task: state.task,
    confirmedValues: state.confirmedValues,
    questionsAsked: state.questionsAsked,
    phase: state.phase,
    conversationTurn: state.conversationHistory.length
  };
}

// Test suite
let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Run tests
console.log('Testing State Management Functions\n');

test('generateSessionId creates unique IDs', () => {
  const id1 = generateSessionId();
  const id2 = generateSessionId();
  assert(id1 !== id2, 'Session IDs should be unique');
  assert(id1.length === 32, 'Session ID should be 32 characters (16 bytes hex)');
});

test('updateProjectState creates new state for new session', () => {
  const sessionId = generateSessionId();
  const state = updateProjectState(sessionId, {
    task: 'faucet_replacement'
  });
  
  assert(state.task === 'faucet_replacement', 'Task should be set');
  assert(state.phase === 'ASSESSMENT', 'Phase should default to ASSESSMENT');
  assert(Array.isArray(state.questionsAsked), 'questionsAsked should be an array');
  assert(Array.isArray(state.conversationHistory), 'conversationHistory should be an array');
});

test('getProjectState retrieves existing state', () => {
  const sessionId = generateSessionId();
  updateProjectState(sessionId, {
    task: 'electrical_work',
    confirmedValues: { hasBreaker: true }
  });
  
  const retrieved = getProjectState(sessionId);
  assert(retrieved !== null, 'State should be retrievable');
  assert(retrieved.task === 'electrical_work', 'Task should match');
  assert(retrieved.confirmedValues.hasBreaker === true, 'Confirmed values should match');
});

test('getProjectState returns null for non-existent session', () => {
  const state = getProjectState('non-existent-session-id');
  assert(state === null, 'Should return null for non-existent session');
});

test('updateProjectState merges with existing state', () => {
  const sessionId = generateSessionId();
  
  // Create initial state
  updateProjectState(sessionId, {
    task: 'plumbing_leak',
    confirmedValues: { location: 'kitchen' }
  });
  
  // Update with new data - this should DEEP MERGE confirmedValues
  updateProjectState(sessionId, {
    confirmedValues: { hasShutoff: true }
  });
  
  const state = getProjectState(sessionId);
  assert(state.task === 'plumbing_leak', 'Task should be preserved');
  assert(state.confirmedValues.location === 'kitchen', 'Existing confirmed value should be preserved');
  assert(state.confirmedValues.hasShutoff === true, 'New confirmed value should be added');
  assert(Object.keys(state.confirmedValues).length === 2, 'Should have both confirmed values');
});

test('updateProjectState tracks conversation history', () => {
  const sessionId = generateSessionId();
  
  updateProjectState(sessionId, {
    task: 'faucet_replacement',
    conversationHistory: [
      { role: 'user', content: 'replacing faucet', timestamp: Date.now() }
    ]
  });
  
  updateProjectState(sessionId, {
    conversationHistory: [
      { role: 'user', content: 'replacing faucet', timestamp: Date.now() },
      { role: 'assistant', content: '{"issue":"faucet replacement"}', timestamp: Date.now() }
    ]
  });
  
  const state = getProjectState(sessionId);
  assert(state.conversationHistory.length === 2, 'Should have 2 conversation turns');
  assert(state.conversationHistory[0].role === 'user', 'First turn should be user');
  assert(state.conversationHistory[1].role === 'assistant', 'Second turn should be assistant');
});

test('updateProjectState tracks questions asked', () => {
  const sessionId = generateSessionId();
  
  updateProjectState(sessionId, {
    questionsAsked: ['Is this in the kitchen or bathroom?']
  });
  
  const state = getProjectState(sessionId);
  assert(state.questionsAsked.length === 1, 'Should track questions');
  assert(state.questionsAsked[0].includes('kitchen'), 'Question should be stored');
});

test('serializeProjectState creates proper summary', () => {
  const sessionId = generateSessionId();
  
  updateProjectState(sessionId, {
    task: 'faucet_replacement',
    confirmedValues: { location: 'kitchen', hasShutoff: true },
    questionsAsked: ['Kitchen or bathroom?', 'Do you have shutoff valves?'],
    phase: 'GUIDANCE',
    conversationHistory: [
      { role: 'user', content: 'replacing faucet', timestamp: Date.now() },
      { role: 'assistant', content: '{"needsMoreInfo":true}', timestamp: Date.now() },
      { role: 'user', content: 'kitchen', timestamp: Date.now() }
    ]
  });
  
  const state = getProjectState(sessionId);
  const serialized = serializeProjectState(state);
  
  assert(serialized !== null, 'Serialized state should not be null');
  assert(serialized.task === 'faucet_replacement', 'Task should be included');
  assert(serialized.conversationTurn === 3, 'Should count conversation turns');
  assert(serialized.phase === 'GUIDANCE', 'Phase should be included');
  assert(serialized.questionsAsked.length === 2, 'Questions should be included');
  assert(Object.keys(serialized.confirmedValues).length === 2, 'Confirmed values should be included');
});

test('serializeProjectState handles null state', () => {
  const serialized = serializeProjectState(null);
  assert(serialized === null, 'Should return null for null state');
});

test('State store maintains multiple sessions independently', () => {
  const session1 = generateSessionId();
  const session2 = generateSessionId();
  
  updateProjectState(session1, { task: 'faucet_replacement', phase: 'ASSESSMENT' });
  updateProjectState(session2, { task: 'electrical_work', phase: 'STOP' });
  
  const state1 = getProjectState(session1);
  const state2 = getProjectState(session2);
  
  assert(state1.task === 'faucet_replacement', 'Session 1 task should be preserved');
  assert(state2.task === 'electrical_work', 'Session 2 task should be preserved');
  assert(state1.phase === 'ASSESSMENT', 'Session 1 phase should be independent');
  assert(state2.phase === 'STOP', 'Session 2 phase should be independent');
});

test('Conversation history is limited to prevent unbounded growth', () => {
  const sessionId = generateSessionId();
  const MAX_HISTORY = 20;
  
  // Create more than MAX_HISTORY conversation turns
  const longHistory = [];
  for (let i = 0; i < 25; i++) {
    longHistory.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
      timestamp: Date.now()
    });
  }
  
  updateProjectState(sessionId, {
    task: 'test',
    conversationHistory: longHistory
  });
  
  const state = getProjectState(sessionId);
  assert(state.conversationHistory.length === MAX_HISTORY, `Should truncate to ${MAX_HISTORY} turns`);
  assert(state.conversationHistory[0].content === 'Message 5', 'Should keep most recent messages');
});

test('Deep merge preserves nested confirmed values', () => {
  const sessionId = generateSessionId();
  
  // Set initial nested values
  updateProjectState(sessionId, {
    confirmedValues: { location: 'kitchen', details: { type: 'sink' } }
  });
  
  // Add more nested values
  updateProjectState(sessionId, {
    confirmedValues: { hasShutoff: true, details: { brand: 'kohler' } }
  });
  
  const state = getProjectState(sessionId);
  assert(state.confirmedValues.location === 'kitchen', 'Top-level value should be preserved');
  assert(state.confirmedValues.hasShutoff === true, 'New top-level value should be added');
  assert(state.confirmedValues.details.type === 'sink', 'Nested value should be preserved');
  assert(state.confirmedValues.details.brand === 'kohler', 'New nested value should be added');
});

// Summary
console.log('\n' + '═'.repeat(70));
console.log(`\n📊 Test Results: ${testsPassed}/${testsRun} passed\n`);

if (testsPassed === testsRun) {
  console.log('✅ All state management tests passed!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!\n');
  process.exit(1);
}
