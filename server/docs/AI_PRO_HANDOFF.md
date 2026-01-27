# AI → Pro Handoff Feature Documentation

## Overview
The AI → Pro Handoff feature automatically connects homeowners with professional service providers when the AI diagnosis determines that professional help is required.

## Implementation Details

### 1. Database Schema Extensions

#### JobRequest Model (`/server/models/JobRequest.js`)
New fields added:
- `source`: Enum ['MANUAL', 'AI_DIAGNOSED'] - Tracks lead origin
- `priority`: Enum ['LOW', 'MEDIUM', 'HIGH'] - Lead priority level
- `aiQualified`: Boolean - Indicates if lead was AI-qualified
- `aiDiagnosis`: Object - Stores full AI diagnosis details
  - `issue`: String - Problem summary
  - `difficulty`: Number (1-10) - Difficulty rating
  - `riskLevel`: String - Risk assessment
  - `diyAllowed`: Boolean - Whether DIY is safe
  - `steps`: Array of strings - DIY steps (if allowed)
  - `stopConditions`: Array of strings - When to stop and call pro
- `aiImages`: Array of strings - Images submitted with diagnosis

#### Pro Model (`/server/models/Pro.js`)
New field added:
- `subscriptionTier`: Enum ['free', 'pro', 'ai_plus'] - Subscription tier for prioritization

### 2. Services

#### Pro Matching Service (`/server/services/proMatching.js`)
Handles intelligent matching of homeowners to professionals.

**Function: `matchPros(params)`**
- **Parameters:**
  - `trade`: String - Required trade skill
  - `coordinates`: Array [lng, lat] - Location coordinates
  - `maxDistance`: Number - Max distance in miles (default: 30)
  - `prioritizeAIPlus`: Boolean - Prioritize AI+ subscribers (default: false)

- **Returns:** Array of matched pros with metadata (distance, internal score)

**Matching Criteria:**
1. Trade skill match (exact match on trade field)
2. Distance ≤ 30 miles (configurable)
3. Active status (`isActive: true`)
4. Notifications enabled (`wantsNotifications: true`)
5. Not paused (`subscriptionStatus !== 'paused'`)

**Internal Scoring (NOT exposed to client):**
- Subscription tier: AI+ (100 pts), Pro (50 pts), Free (10 pts)
- Rating: 0-50 points (rating × 10)
- Experience: 0-30 points (completed jobs, capped at 30)
- Verification: 20 points bonus
- Distance penalty: -1 to -30 points (closer is better)

**Function: `formatProsForClient(matchedPros, limit)`**
Returns client-safe data only:
- `id`: Professional ID
- `name`: Professional name
- `distance`: Distance in miles (rounded to 1 decimal)
- `rating`: Average rating
- `reviewCount`: Number of reviews
- `completedJobs`: Jobs completed
- `isVerified`: Verification status
- `availability`: Availability status (placeholder)

**SECURITY NOTE:** Internal scoring, contact info, and subscription tier are NEVER exposed to client.

#### Lead Creation Service (`/server/services/leadService.js`)
Handles creation of AI-diagnosed leads.

**Function: `createAIDiagnosedLead(params)`**
Creates a new JobRequest with AI diagnosis metadata.

**Required Parameters:**
- `name`: Customer name
- `phone`: Customer phone (E.164 format)
- `trade`: Service type/trade
- `description`: Issue description
- `aiDiagnosis`: Full diagnosis object from AI

**Optional Parameters:**
- `userId`: User ID
- `email`: Customer email
- `address`, `city`, `state`, `zip`: Location info
- `images`: Array of image URLs
- `priority`: Lead priority (default: 'HIGH')

**Process:**
1. Validates required fields
2. Geocodes address (with fallback to US center)
3. Normalizes trade name
4. Creates JobRequest with:
   - `source: 'AI_DIAGNOSED'`
   - `priority: 'HIGH'` (default)
   - `aiQualified: true`
   - Full diagnosis data
   - Image URLs

### 3. API Endpoint Extension

#### POST `/api/ai/diagnose`

**Enhanced Behavior:**

After generating AI diagnosis, the endpoint checks:
```javascript
if (diagnosis.diyAllowed === false || diagnosis.riskLevel === 'HIGH')
```

If condition is met AND minimum user info is provided (name, phone, address, trade):
1. Creates an AI-diagnosed lead
2. Matches nearby professionals (≤ 30 miles)
3. Prioritizes AI+ subscribers
4. Returns `PRO_RECOMMENDED` mode with matched pros

**Request Body (Extended):**
```json
{
  "description": "Issue description",
  "images": ["image_url_1", "image_url_2"],
  "userId": "optional_user_id",
  
  // Required for handoff:
  "name": "Customer Name",
  "phone": "+15551234567",
  "address": "123 Main St, City, State",
  "city": "City",
  "state": "State",
  "zip": "12345",
  "trade": "Electrical"
}
```

**Response Formats:**

**DIY Mode** (low risk, DIY allowed):
```json
{
  "success": true,
  "mode": "DIY",
  "diagnosis": {
    "issue": "Problem summary",
    "difficulty": 3,
    "riskLevel": "LOW",
    "diyAllowed": true,
    "steps": ["Step 1", "Step 2"],
    "stopConditions": ["When to stop"]
  },
  "timestamp": "2026-01-27T04:00:00.000Z"
}
```

**PRO_RECOMMENDED Mode** (high risk or DIY not allowed):
```json
{
  "success": true,
  "mode": "PRO_RECOMMENDED",
  "diagnosis": {
    "issue": "Problem summary",
    "difficulty": 8,
    "riskLevel": "HIGH",
    "diyAllowed": false,
    "steps": [],
    "stopConditions": ["Safety concerns"]
  },
  "lead": {
    "id": "lead_id_here",
    "status": "pending"
  },
  "matchedPros": [
    {
      "id": "pro_id",
      "name": "Professional Name",
      "distance": 5.2,
      "rating": 4.8,
      "reviewCount": 45,
      "completedJobs": 120,
      "isVerified": true,
      "availability": "Available"
    }
  ],
  "timestamp": "2026-01-27T04:00:00.000Z"
}
```

**Fallback Behavior:**
- If user info is incomplete: Returns diagnosis only (no handoff)
- If handoff fails: Returns diagnosis only (error logged internally)
- Both scenarios default to DIY mode response

### 4. Testing

**Unit Tests** (`/server/test-ai-handoff.js`):
- ✅ Handoff trigger conditions (5 test cases)
- ✅ Response format validation
- ✅ Pro matching logic (requires DB)
- ✅ Lead creation (requires DB)

**Manual Validation** (`/server/test-ai-diagnose-handoff-manual.js`):
- High-risk electrical issue → PRO_RECOMMENDED
- Low-risk repair → DIY
- Missing user info → Diagnosis only

### 5. Security Considerations

**What is NEVER exposed to client:**
- Internal scoring algorithm
- Professional contact info (phone, email)
- Subscription tier details
- Location coordinates (only distance)
- Database query logic

**What IS exposed to client:**
- Professional ID (for selection)
- Professional name
- Distance in miles
- Public rating and review count
- Verification status
- Generic availability status

### 6. Integration Points

**Existing Systems:**
- Uses existing `geocodeAddress` utility from `/server/utils/geocode.js`
- Follows existing lead creation patterns from `/server/routes/leads.js`
- Compatible with existing Pro model and geospatial queries
- Can trigger existing pro notification system (optional enhancement)

**Future Enhancements:**
- Integrate with notification system to alert matched pros
- Add real-time availability checking
- Implement lead acceptance workflow
- Add analytics for AI → Pro conversion rates

## Usage Example

```javascript
// Client-side code example
const response = await fetch('/api/ai/diagnose', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'My outlet is sparking and smells like burning',
    images: ['https://cdn.example.com/image1.jpg'],
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+15551234567',
    address: '123 Main St, Charlotte, NC 28202',
    city: 'Charlotte',
    state: 'NC',
    zip: '28202',
    trade: 'Electrical'
  })
});

const data = await response.json();

if (data.mode === 'PRO_RECOMMENDED') {
  // Show matched professionals
  console.log(`Matched ${data.matchedPros.length} pros`);
  console.log('Lead created:', data.lead.id);
} else {
  // Show DIY instructions
  console.log('DIY steps:', data.diagnosis.steps);
}
```

## Changelog

**v1.0.0 - 2026-01-27**
- Initial implementation of AI → Pro handoff
- Added database schema extensions
- Created Pro matching service
- Created Lead creation service
- Extended `/api/ai/diagnose` endpoint
- Added comprehensive test suite
