# Fixlo Google Ads Assets Setup Guide

This guide explains how to use the newly created Google Ads logo assets for Fixlo advertising campaigns.

## Available Assets

### 1. Square Transparent Logo (`fixlo-logo-square.png`)
- **Dimensions**: 512x512px
- **Format**: PNG with transparent background
- **Usage**: Profile pictures, avatar images, social media icons
- **Content**: "Fixlo" text with gradient styling and tool icons
- **File Size**: 6KB

### 2. Dark Background Horizontal Logo (`fixlo-logo-dark.png`)
- **Dimensions**: 1200x300px
- **Format**: PNG with dark background (#0B0B0F)
- **Usage**: Banner ads, header graphics, horizontal promotional materials
- **Content**: "Fixlo" text in white with tool icon and accent line
- **File Size**: 15KB

### 3. Stacked Logo with Tagline (`fixlo-logo-tagline.png`)
- **Dimensions**: 1024x1024px
- **Format**: PNG with transparent background
- **Usage**: Square ads, promotional materials, app store graphics
- **Content**: "Fixlo" branding with "Trusted Home Services" tagline
- **File Size**: 38KB

## File Locations

All Google Ads assets are located in:
```
client/public/logos/ads/
├── fixlo-logo-square.png
├── fixlo-logo-dark.png
└── fixlo-logo-tagline.png
```

## Implementation Examples

### Google Ads Campaign Setup
1. **Display Ads**: Use `fixlo-logo-dark.png` for banner placements
2. **Social Media**: Use `fixlo-logo-square.png` for profile/avatar images
3. **App Promotion**: Use `fixlo-logo-tagline.png` for app store campaigns

### Web Usage
```html
<!-- Square logo for social sharing -->
<meta property="og:image" content="/client/public/logos/ads/fixlo-logo-square.png">

<!-- Banner advertisement -->
<img src="/client/public/logos/ads/fixlo-logo-dark.png" 
     alt="Fixlo Home Services" 
     style="width: 100%; max-width: 1200px; height: auto;">

<!-- App promotion graphic -->
<img src="/client/public/logos/ads/fixlo-logo-tagline.png" 
     alt="Fixlo - Trusted Home Services" 
     style="width: 300px; height: 300px; object-fit: contain;">
```

## Brand Compliance

All logos follow Fixlo's brand guidelines:
- **Primary Colors**: Gradient from #667eea to #764ba2
- **Typography**: Inter font family, bold weight
- **Icon Elements**: Tool-themed graphics (wrench, hammer, screwdriver)
- **Tagline**: "Trusted Home Services"

## Optimization Details

- All files are optimized PNGs under 150KB
- Transparent backgrounds where appropriate
- High-resolution suitable for retina displays
- Compressed for web delivery

## Usage Rights

These assets are for official Fixlo marketing and advertising use only. Do not modify the logos without brand approval.

---

**Generated**: $(date)
**Path**: `client/public/logos/ads/`
**Total Assets**: 3 files
**Combined Size**: 59KB