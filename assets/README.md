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

### Google Ads Assets (client/public/logos/ads/)
- `fixlo-logo-square.png` - Square transparent logo (512x512, "Fixlo" mark only)
- `fixlo-logo-dark.png` - Dark background horizontal logo (1200x300, white text)
- `fixlo-logo-tagline.png` - Stacked logo with tagline (1024x1024, "Fixlo" + "Trusted Home Services")

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

### Google Ads Implementation
```html
<!-- Square transparent logo for profile/avatar use -->
<img src="/client/public/logos/ads/fixlo-logo-square.png" alt="Fixlo" style="width: 512px; height: 512px;">

<!-- Horizontal dark background logo for banner ads -->
<img src="/client/public/logos/ads/fixlo-logo-dark.png" alt="Fixlo" style="width: 1200px; height: 300px;">

<!-- Stacked logo with tagline for promotional materials -->
<img src="/client/public/logos/ads/fixlo-logo-tagline.png" alt="Fixlo - Trusted Home Services" style="width: 1024px; height: 1024px;">
```

## Brand Colors:
- Primary Gradient: #667eea → #764ba2
- Secondary: #ff6b6b → #ffa726
- Text: #2c3e50
- Gray: #7f8c8d
