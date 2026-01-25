# Vercel Routing Flow - Visual Guide

## Current Configuration (VERIFIED ✅)

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://fixloapp.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Request Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  INCOMING REQUEST                           │
│              (e.g., /api/ping or /about)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Vercel Edge Network   │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Check Rewrites Array  │
         │  (Sequential Order)    │
         └────────────┬───────────┘
                      │
                      ▼
    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃  RULE 1: /api/(.*)                  ┃
    ┃  → https://fixloapp.onrender.com    ┃
    ┗━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━┛
                  │
         ┌────────┴────────┐
         │  Does path      │
         │  match pattern? │
         └────┬───────┬────┘
              │       │
        YES   │       │   NO
              │       │
              ▼       ▼
    ┌─────────────┐  ┏━━━━━━━━━━━━━━━━━━━━━━━┓
    │ PROXY TO    │  ┃  RULE 2: /(.*)        ┃
    │ RENDER      │  ┃  → /index.html        ┃
    │ BACKEND     │  ┗━━━━━━━━━┳━━━━━━━━━━━━━┛
    └──────┬──────┘            │
           │                   ▼
           │          ┌─────────────────┐
           │          │ Does path       │
           │          │ match pattern?  │
           │          └────────┬────────┘
           │                   │
           │              YES (always)
           │                   │
           │                   ▼
           │          ┌─────────────────┐
           │          │ SERVE SPA       │
           │          │ (index.html)    │
           │          └────────┬────────┘
           │                   │
           ▼                   ▼
    ┌─────────────────────────────────┐
    │     RESPONSE TO CLIENT          │
    └─────────────────────────────────┘
```

## Example 1: `/api/ping` Request

```
Request: GET https://fixloapp.com/api/ping
         │
         ▼
┌────────────────────────┐
│ Rule 1: /api/(.*)      │
│ Pattern: /api/ping     │
│ Match: YES ✅           │
│ Capture: "ping"        │
└────────┬───────────────┘
         │
         ▼ STOP HERE (first match wins)
         │
┌────────▼───────────────────────────────────────────┐
│ Rewrite to:                                        │
│ https://fixloapp.onrender.com/api/ping             │
└────────┬───────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────┐
│ Render Backend Processes Request                   │
│ - Executes /api/ping endpoint logic                │
│ - Returns JSON response                            │
│ - Sets Content-Type: application/json              │
└────────┬───────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────┐
│ Response to Client:                                │
│ HTTP/2 200                                         │
│ content-type: application/json                     │
│ server: Render                                     │
│                                                    │
│ {"status":"ok",...}                                │
└────────────────────────────────────────────────────┘
```

## Example 2: `/about` Request

```
Request: GET https://fixloapp.com/about
         │
         ▼
┌────────────────────────┐
│ Rule 1: /api/(.*)      │
│ Pattern: /about        │
│ Match: NO ❌            │
│ (doesn't start w/ api) │
└────────┬───────────────┘
         │
         ▼ Continue to next rule
         │
┌────────▼───────────────┐
│ Rule 2: /(.*)          │
│ Pattern: /about        │
│ Match: YES ✅           │
│ Capture: "about"       │
└────────┬───────────────┘
         │
         ▼ STOP HERE (match found)
         │
┌────────▼───────────────────────────────────────────┐
│ Rewrite to: /index.html                            │
└────────┬───────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────┐
│ Vercel Serves Static File                          │
│ - Returns index.html from deployment               │
│ - React app loads in browser                       │
│ - React Router handles /about client-side          │
└────────┬───────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────┐
│ Response to Client:                                │
│ HTTP/2 200                                         │
│ content-type: text/html                            │
│ server: Vercel                                     │
│                                                    │
│ <!DOCTYPE html>                                    │
│ <html>...React app...</html>                       │
└────────────────────────────────────────────────────┘
```

## Why Order Matters

### ✅ CORRECT Order (Current)

```
Priority 1: /api/(.*)  → Render Backend
Priority 2: /(.*)      → SPA Fallback
```

**Result**:
- `/api/*` requests → Render backend (JSON) ✅
- All other requests → SPA (HTML) ✅

### ❌ WRONG Order (Would Break)

```
Priority 1: /(.*)      → SPA Fallback
Priority 2: /api/(.*)  → Render Backend  ← NEVER REACHED!
```

**Result**:
- `/api/*` requests → SPA (HTML) ❌
- Backend never receives API calls ❌
- OAuth callbacks fail ❌
- Mobile app cannot connect ❌

## Pattern Matching Examples

| Request Path | Rule 1 `/api/(.*)` | Rule 2 `/(.*)` | Final Destination |
|--------------|-------------------|----------------|-------------------|
| `/api/ping` | ✅ Match | N/A (stopped) | Render Backend |
| `/api/health` | ✅ Match | N/A (stopped) | Render Backend |
| `/api/user/123` | ✅ Match | N/A (stopped) | Render Backend |
| `/about` | ❌ No Match | ✅ Match | index.html (SPA) |
| `/` | ❌ No Match | ✅ Match | index.html (SPA) |
| `/services/plumbing` | ❌ No Match | ✅ Match | index.html (SPA) |
| `/robots.txt` | ❌ No Match | ✅ Match | index.html (SPA) |

**Note**: Static files like `/robots.txt` exist at root and are served directly by Vercel before rewrites are processed.

## Configuration Validation

### ✅ What We Have (Correct)

```json
{
  "rewrites": [...]  // ONLY this key
}
```

**Keys present**: 1 (`rewrites`)  
**Keys removed**: `redirects`, `headers`, `env`, `routes`, `framework`, `version`, `$schema`

### ❌ What Would Be Wrong

```json
{
  "routes": [
    {"src": "/api/(.*)", ...},
    {"src": "/(.*)", ...}
  ]
}
```

**Problem**: `routes` uses different precedence rules and can conflict with `rewrites`

```json
{
  "redirects": [
    {"source": "/api-old", "destination": "/api", ...}
  ],
  "rewrites": [...]
}
```

**Problem**: Redirects processed before rewrites, could interfere

## Success Verification

### Production Test Command

```bash
curl -i https://fixloapp.com/api/ping
```

### Expected Output (✅ SUCCESS)

```
HTTP/2 200
content-type: application/json        ← JSON (not HTML)
server: Render                        ← Render (not Vercel)
access-control-allow-origin: *
x-powered-by: Express
...

{"status":"ok","timestamp":"2026-01-25T..."}
```

### Failure Output (❌ SPA FALLBACK TRIGGERED)

```
HTTP/2 200
content-type: text/html               ← HTML (should be JSON)
server: Vercel                        ← Vercel (should be Render)
...

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Fixlo</title>
...
```

## Deployment Checklist

- [ ] Merge PR to main
- [ ] Vercel Dashboard → Settings → Advanced
- [ ] **CLEAR BUILD CACHE** ← CRITICAL
- [ ] Trigger FULL redeploy (no preview reuse)
- [ ] Wait 2-3 minutes for deployment
- [ ] Run: `curl -i https://fixloapp.com/api/ping`
- [ ] Verify: `content-type: application/json`
- [ ] Verify: `server` is NOT "Vercel"
- [ ] Verify: Response body is JSON (not HTML)

---

**Configuration Status**: ✅ VERIFIED AND READY  
**Documentation**: Complete visual routing flow  
**Ready for**: Merge → Cache Clear → Deploy → Verify
