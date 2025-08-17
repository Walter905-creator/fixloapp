# FIXLO BUILD Tracking System

This document describes the FIXLO BUILD tracking system that handles build notifications and metadata.

## Overview

The system supports tracking build metadata in the format:
```
FIXLO BUILD {BUILD_ID: '2025-08-16T22:19:50', COMMIT_SHA: '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde'}
```

## Usage

### Setting Build Metadata

Use the npm script to set build metadata from a FIXLO BUILD string:

```bash
npm run set-build-metadata "FIXLO BUILD {BUILD_ID: '2025-08-16T22:19:50', COMMIT_SHA: '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde'}"
```

### Direct Script Usage

You can also call the script directly:

```bash
node scripts/set-build-metadata.js "FIXLO BUILD {BUILD_ID: '2025-08-16T22:19:50', COMMIT_SHA: '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde'}"
```

### Environment Variables

The system supports these environment variables:

- `FIXLO_BUILD_ID` - The build timestamp (ISO format)
- `FIXLO_COMMIT_SHA` - The git commit SHA
- `REACT_APP_BUILD_ID` - React app build ID (fallback)
- `REACT_APP_COMMIT_SHA` - React app commit SHA (fallback)

## Files Updated

### Version Files

The system updates these files with build metadata:

- `/version.json` - Root version file
- `/client/public/version.json` - Client version file

Both files contain:
```json
{
  "commit": "622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde",
  "branch": "main",
  "buildTime": "2025-08-16T22:35:08.030Z",
  "buildId": "2025-08-16T22:19:50",
  "commitSha": "622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde"
}
```

### Console Logging

When the client application loads, it logs the build information:

```javascript
console.log('FIXLO BUILD', {
  BUILD_ID: '2025-08-16T22:19:50',
  COMMIT_SHA: '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde'
});
```

## Testing

### Run All Tests

```bash
node scripts/test-build-metadata.js
```

### Run Client Tests

```bash
cd client && npm test -- --testPathPattern=buildTracking.test.js --watchAll=false
```

## Integration

### Build Process

The system integrates with the existing build process:

1. Set environment variables or use the script to set build metadata
2. Run the normal build process (`npm run build`)
3. The build will include the metadata in the output

### Production Verification

The production verification scripts can validate that builds contain the correct metadata.

## Files

- `scripts/set-build-metadata.js` - Main script for parsing and setting build metadata
- `scripts/test-build-metadata.js` - Test suite for the build system
- `client/scripts/write-version.js` - Enhanced to support FIXLO build variables
- `client/src/index.jsx` - Enhanced to log FIXLO BUILD format
- `client/src/utils/buildTracking.test.js` - Unit tests for build tracking

## Backward Compatibility

The system maintains full backward compatibility with existing build processes:

- Existing `REACT_APP_BUILD_ID` and `REACT_APP_COMMIT_SHA` variables still work
- Default date-based BUILD_ID generation still works if no FIXLO variables are set
- All existing build scripts continue to function normally

## Error Handling

The script validates the FIXLO BUILD format and provides clear error messages:

```bash
node scripts/set-build-metadata.js "invalid format"
# Output: ❌ Error: Invalid FIXLO BUILD format. Expected: FIXLO BUILD {'BUILD_ID': '...', 'COMMIT_SHA': '...'}
```

## Examples

### Successful Usage

```bash
$ npm run set-build-metadata "FIXLO BUILD {BUILD_ID: '2025-08-16T22:19:50', COMMIT_SHA: '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde'}"

Parsed build metadata: {
  BUILD_ID: '2025-08-16T22:19:50',
  COMMIT_SHA: '622a34a1f99d5ce0dbb5ea1d0186d4c51ff75dde'
}
Updated /path/to/version.json
✅ Build metadata set successfully
```

### Testing

```bash
$ node scripts/test-build-metadata.js

🧪 Testing FIXLO BUILD metadata system...

Test 1: Parsing FIXLO BUILD format
✅ PASS: Parse FIXLO BUILD format

Test 2: Updating version.json files
✅ PASS: Update version.json files

Test 3: Verifying file contents
✅ PASS: Root version.json has required fields
✅ PASS: Client version.json has required fields

🎉 All tests passed! FIXLO BUILD metadata system is working correctly.
```