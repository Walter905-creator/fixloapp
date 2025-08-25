# Fixlo Logo Assets

This directory contains the official Fixlo logo assets for use across web and mobile platforms.

## Files Created:

### SVG Assets (Vector)
- `fixlo-logo-2025.svg` - Full horizontal logo with text (approved 2025 version)
- `fixlo-icon.svg` - Icon only version (120x120)

### PNG Assets (Raster) 
- `fixlo-logo.png` - Full logo in PNG format
- `fixlo-icon.png` - Icon only in PNG format
- `fixlo-logo-white.png` - White version for dark backgrounds

## Usage Guidelines:

### Web Implementation
```html
<!-- In header -->
<img src="/assets/brand/fixlo-logo-2025.svg" alt="Fixlo" style="height: 50px;">

<!-- Icon only -->
<img src="/assets/fixlo-icon.svg" alt="Fixlo" style="width: 40px; height: 40px;">
```

### Mobile App Implementation
```jsx
import { Image } from 'react-native';

<Image
  source={require('./assets/fixlo-logo.png')}
  style={{ width: 200, height: 60, resizeMode: 'contain' }}
/>
```

### Recommended Sizes:
- **Website Header:** 50px height
- **Mobile App:** 200px width (auto height)
- **Favicon:** 32x32px (use icon version)
- **App Store:** 1024x1024px (use icon version, scaled)

## Brand Colors:
- Primary Gradient: #667eea → #764ba2
- Secondary: #ff6b6b → #ffa726
- Text: #2c3e50
- Gray: #7f8c8d
