# Multi-Turn Conversation Manual Testing Guide

## Overview
This guide walks through manually testing the multi-turn conversation feature for `/api/ai/diagnose`.

## Prerequisites
1. Server running on port 3001
2. OpenAI API key configured in `.env`
3. Valid AI subscription or middleware bypassed for testing
4. MongoDB connection (optional - will work in API-only mode)

## Testing Scenario: Faucet Replacement

This test validates that the AI:
- Never repeats questions already answered
- Moves forward logically through the project
- Only asks for missing information
- Does NOT restart intake if the task is already known

### Turn 1: Initial Project Statement

**Request:**
```bash
curl -X POST http://localhost:3001/api/ai/diagnose \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "description": "replacing faucet",
    "images": [],
    "userId": "test-user-123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "sessionId": "abc123...",
  "needsMoreInfo": true,
  "issue": "Faucet replacement project",
  "questions": [
    "Is this for a kitchen or bathroom faucet?",
    "Do you have shutoff valves under the sink?",
    "Can you easily access under the sink?"
  ],
  "phase": "ASSESSMENT",
  "timestamp": "..."
}
```

**✅ Success Criteria:**
- Returns `sessionId` for continuation
- Returns `needsMoreInfo: true`
- Asks specific questions about the faucet project
- Does NOT provide full diagnosis yet

**❌ Failure Indicators:**
- No sessionId
- Provides full diagnosis immediately
- Asks generic "what is your project?" questions

### Turn 2: User Answers Location

**Request:**
```bash
curl -X POST http://localhost:3001/api/ai/diagnose \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "description": "kitchen",
    "images": [],
    "userId": "test-user-123",
    "sessionId": "abc123..."
  }'
```

**Note:** Use the SAME sessionId from Turn 1

**Expected Response:**
```json
{
  "success": true,
  "sessionId": "abc123...",
  "needsMoreInfo": true,
  "issue": "Kitchen faucet replacement",
  "questions": [
    "Do you have shutoff valves under the sink?",
    "What type of faucet mounting? (single-hole or 3-hole)"
  ],
  "phase": "ASSESSMENT",
  "timestamp": "..."
}
```

**✅ Success Criteria:**
- SAME sessionId returned
- Does NOT ask "kitchen or bathroom?" again
- Asks NEW questions not asked in Turn 1
- Shows understanding of "kitchen" context

**❌ Failure Indicators:**
- Different sessionId
- Repeats location question
- Asks "what project are you working on?"
- No context from previous turn

### Turn 3: User Confirms Shutoff Valves

**Request:**
```bash
curl -X POST http://localhost:3001/api/ai/diagnose \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "description": "yes I have shutoff valves",
    "images": [],
    "userId": "test-user-123",
    "sessionId": "abc123..."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "sessionId": "abc123...",
  "needsMoreInfo": false,
  "mode": "DIY",
  "diagnosis": {
    "issue": "Kitchen faucet replacement with accessible shutoff valves",
    "difficulty": 4,
    "riskLevel": "LOW",
    "diyAllowed": true,
    "steps": [
      "Turn off water supply using shutoff valves",
      "Place bucket under sink",
      "Disconnect supply lines",
      "..."
    ],
    "stopConditions": [...]
  },
  "phase": "GUIDANCE",
  "timestamp": "..."
}
```

**✅ Success Criteria:**
- Does NOT repeat shutoff valve question
- Provides complete diagnosis
- Includes steps and guidance
- Phase changed to "GUIDANCE"

**❌ Failure Indicators:**
- Asks about shutoff valves again
- Restarts conversation
- Doesn't provide diagnosis

## Test Results Format

Document results as:

```
TURN 1: Initial Statement
✅ SessionId generated
✅ Questions asked appropriately
✅ No full diagnosis yet

TURN 2: Answer "kitchen"
✅ Same sessionId maintained
✅ No repeated questions
✅ Conversation moved forward

TURN 3: Answer "yes shutoff valves"
✅ Complete diagnosis provided
✅ No question repetition
✅ Appropriate guidance given

OVERALL: ✅ PASS / ❌ FAIL
```

## Alternative Test Without Auth

If you don't have authentication set up, temporarily comment out the middleware:

**In `server/routes/ai.js`:**
```javascript
// router.post("/diagnose", requireAISubscription, async (req, res) => {
router.post("/diagnose", async (req, res) => {
```

Then test without the Authorization header.

**⚠️ Remember to restore the middleware after testing!**

## Troubleshooting

### "Authentication required" error
- You need a valid JWT token
- Or temporarily bypass the middleware

### "Session not found" warning
- The session expired (2-hour TTL)
- Or wrong sessionId used
- Check server logs for session cleanup messages

### Server not responding
- Check if server is running: `ps aux | grep "node.*index.js"`
- Check port 3001: `lsof -i :3001`
- Check server logs for errors

### Questions repeated
- **THIS IS THE BUG WE'RE FIXING!**
- Check that sessionId is being passed correctly
- Verify state is being persisted (check server logs)

## Success Criteria Summary

The implementation is successful if:

1. ✅ User says "replacing faucet"
2. ✅ AI asks "kitchen or bathroom? shutoff valves? upload photo?"
3. ✅ User says "kitchen"
4. ✅ AI says "great — do you have shutoff valves under the sink?"
5. ✅ AI does NOT ask "what project are you working on?"

**If you see forward motion without question repetition, you're done!**
