# AI Diagnosis Endpoint Documentation

## Overview
The `/api/ai/diagnose` endpoint provides AI-powered home repair diagnosis using OpenAI's Vision API (gpt-4o model). It analyzes user-submitted descriptions and optional images to provide structured, safety-focused home repair assessments.

## Endpoint

**URL:** `POST /api/ai/diagnose`

**Authentication:** None required

**Rate Limiting:** Inherits from Express rate limiting middleware

## Request Format

### Headers
```
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | Yes | Description of the home repair issue (non-empty) |
| `images` | array | No | Array of image URLs or base64 data URIs (max 5) |
| `userId` | string | No | User identifier for logging purposes |

### Request Example

```json
{
  "description": "My kitchen faucet is leaking water from the base. It drips constantly even when turned off.",
  "images": [
    "https://example.com/faucet-leak.jpg",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ],
  "userId": "user-12345"
}
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "diagnosis": {
    "issue": "Leaking kitchen faucet from base - likely worn O-ring or loose connection",
    "difficulty": 4,
    "riskLevel": "LOW",
    "diyAllowed": true,
    "steps": [
      "Turn off water supply under sink",
      "Place bucket under faucet",
      "Remove faucet handle (usually Allen key or Phillips screw)",
      "Inspect and replace O-ring or tighten connections",
      "Reassemble and test"
    ],
    "stopConditions": [
      "If unable to turn off water supply",
      "If faucet is corroded or damaged",
      "If leak persists after O-ring replacement",
      "If you're uncomfortable with any step"
    ]
  },
  "timestamp": "2026-01-27T03:30:00.000Z"
}
```

## Response Fields

### diagnosis Object

| Field | Type | Description |
|-------|------|-------------|
| `issue` | string | Clear summary of the identified problem |
| `difficulty` | number | Difficulty rating from 1 (easiest) to 10 (hardest) |
| `riskLevel` | string | Risk assessment: "LOW", "MEDIUM", or "HIGH" |
| `diyAllowed` | boolean | Whether DIY repair is safe and recommended |
| `steps` | array | Step-by-step repair instructions (empty if diyAllowed=false) |
| `stopConditions` | array | Conditions indicating when to stop and call a professional |

## Safety Rules

1. **HIGH Risk Enforcement**: If `riskLevel` is "HIGH", the system automatically:
   - Sets `diyAllowed` to `false`
   - Clears the `steps` array
   - This cannot be overridden

2. **Risk Level Guidelines**:
   - **LOW**: Simple repairs, no safety hazards, common household tasks
   - **MEDIUM**: Some complexity, requires specific tools, minor safety considerations
   - **HIGH**: Safety hazards present, requires professional expertise, liability concerns

## Image Format Requirements

### Supported Formats

1. **HTTP/HTTPS URLs**: `http://example.com/image.jpg`
2. **Base64 Data URIs**: `data:image/jpeg;base64,/9j/4AAQSkZJRg...`

### Image Constraints

- Maximum 5 images per request
- Images sent directly to OpenAI API (not stored on server)
- Invalid formats return 400 error with specific index

## Technical Implementation

- **Model**: gpt-4o (supports vision)
- **Temperature**: 0.3 (consistent, safety-focused responses)
- **Max Tokens**: 1500
- **Response Format**: JSON object with structured schema
- **Client**: Singleton OpenAI client (not reinitialized per request)

## Error Responses

- **400**: Validation errors (missing description, invalid images, etc.)
- **503**: Service unavailable (no API key, rate limited)
- **500**: Internal errors (never exposes OpenAI details)

## Testing

✅ 14 comprehensive test cases  
✅ 100% test pass rate  
✅ All validation scenarios covered
