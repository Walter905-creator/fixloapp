# Fixlo SEO Landing Page System

This directory contains the automated SEO landing page generation system for Fixlo. It generates **bilingual** (English + Spanish) SEO-optimized landing pages for every service/city combination.

## 📋 Overview

The system automatically generates:
- **1,000 pages** (50 services × 10 cities × 2 languages)
- Full SEO optimization (meta tags, JSON-LD schema, canonical URLs)
- Viral slang integration for modern, engaging content
- Unique content for each page (no duplicate content issues)
- Mobile-responsive, accessible design

## 🗂️ File Structure

```
seo/
├── services.json       # List of all services (50 services)
├── cities.json         # List of major U.S. cities (10 top cities)
├── slang.json          # Viral slang terms (English + Spanish)
├── generator.mjs       # Main generation script
└── README.md          # This file

client/src/pages/services/
└── [service]/
    └── [city]/
        ├── index.jsx   # English version
        └── es.jsx      # Spanish version
```

## 🚀 Quick Start

### Generate All Pages

Run the following command from the project root:

```bash
npm run generate:seo
```

This will generate all SEO pages for every service/city combination in both English and Spanish.

### Generation Time

- **Total pages**: 1,000 (50 services × 10 cities × 2 languages)
- **Estimated time**: 1-2 seconds
- **Output**: `client/src/pages/services/[service]/[city]/`

## 📝 Adding New Services

1. Open `seo/services.json`
2. Add your service to the array:

```json
[
  "Handyman",
  "Plumbing",
  "Your New Service"
]
```

3. Regenerate pages:

```bash
npm run generate:seo
```

## 🌆 Adding New Cities

1. Open `seo/cities.json`
2. Add your city with state:

```json
[
  { "city": "New York", "state": "NY" },
  { "city": "Your City", "state": "ST" }
]
```

3. Regenerate pages:

```bash
npm run generate:seo
```

## 🌐 Bilingual System

### English Pages
- Path: `/services/[service]/[city]/`
- File: `index.jsx`
- Meta language: `en`

### Spanish Pages
- Path: `/services/[service]/[city]/es`
- File: `es.jsx`
- Meta language: `es`

## 🎯 SEO Features

### Meta Tags
Each page includes:
- Custom title with service, city, and viral slang
- Optimized meta description
- Canonical URL to prevent duplicate content
- Language meta tags for Spanish pages

### JSON-LD Schema
Every page includes LocalBusiness schema with:
- Business name and description
- Service area (city/state)
- Contact information
- Aggregate ratings
- Price range

### Content Strategy
- **H1**: Service + City + Viral slang hook
- **Intro**: Value proposition with slang integration
- **Trusted Pros**: Social proof and benefits
- **Vibe Check**: Key features and differentiators
- **Local Services**: Dynamic service list for that city
- **Girl/Boy Dinner Reset**: Relatable problem-solving
- **CTA**: Strong call-to-action with slang

## 🗣️ Viral Slang Integration

### English Slang Terms
- 6-7, bop, mogging, looksmaxxing, sleepmaxxing
- it's giving, aesthetic, adulting, GOAT, delulu
- rizz, mid, main character, she ate, core-core
- bet, ghosting, girl dinner, boy dinner, vibe check, no cap

### Spanish Equivalents
- 6-7, flow, dominando, ponte más guapo/guapa, dormir brutal
- está dando vibras, estética, vida adulta, el GOAT, delulu
- flow/rizz, normalito, personaje principal, ella se la comió
- core-core, de una, ghosting, cena de chica, cena de chico
- chequeo de vibras, sin mentiras

## 🛠️ Utilities

### `formatSlug(text)`
Converts text to URL-safe slug format.

```javascript
formatSlug("Kitchen Remodeling") // "kitchen-remodeling"
```

### `generateMeta(service, city, lang)`
Generates meta tags for a page.

```javascript
const meta = generateMeta("plumbing", "new-york", "en");
// Returns: { title, description, canonical }
```

### `generateSchema(service, city, lang)`
Generates JSON-LD LocalBusiness schema.

```javascript
const schema = generateSchema("plumbing", "new-york", "en");
// Returns: Full schema.org LocalBusiness object
```

### `writeSEOPage(service, city, state, lang)`
Writes a complete SEO page file.

```javascript
writeSEOPage("Plumbing", "New York", "NY", "en");
// Creates: client/src/pages/services/plumbing/new-york/index.jsx
```

## 📊 Page Template Structure

### English Template
```jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function ServiceCityPage() {
  return (
    <>
      <Helmet>
        {/* SEO meta tags */}
      </Helmet>
      
      <div className="min-h-screen">
        {/* Hero Section */}
        {/* Trusted Pros Section */}
        {/* Vibe Check Section */}
        {/* Local Services List */}
        {/* Girl/Boy Dinner Reset */}
        {/* Service Request Form */}
        {/* Final CTA */}
      </div>
    </>
  );
}
```

## 🚢 Deployment

### Vercel Deployment

The generated pages are automatically deployed with your main build:

1. Generate pages locally:
   ```bash
   npm run generate:seo
   ```

2. Commit and push:
   ```bash
   git add client/src/pages/services/
   git commit -m "Generate SEO landing pages"
   git push
   ```

3. Vercel will automatically build and deploy

### Build Process

The pages are built with Vite and optimized for production:
- Code splitting for each page
- Lazy loading
- Tree shaking
- Minification

## 🔍 Testing Generated Pages

### Local Testing

1. Generate pages:
   ```bash
   npm run generate:seo
   ```

2. Start development server:
   ```bash
   cd client && npm run dev
   ```

3. Visit a page:
   - English: `http://localhost:5173/services/plumbing/new-york`
   - Spanish: `http://localhost:5173/services/plumbing/new-york/es`

### Production Testing

After deployment, test a few sample URLs:
- `https://fixloapp.com/services/handyman/los-angeles`
- `https://fixloapp.com/services/handyman/los-angeles/es`
- `https://fixloapp.com/services/plumbing/chicago`
- `https://fixloapp.com/services/plumbing/chicago/es`

## 📈 SEO Best Practices

### Implemented Features
✅ Unique content for each page  
✅ Proper heading hierarchy (H1, H2, H3)  
✅ Semantic HTML structure  
✅ Mobile-responsive design  
✅ Fast page load times (Vite optimization)  
✅ Canonical URLs  
✅ Structured data (JSON-LD)  
✅ Language meta tags  
✅ Internal linking  
✅ Clear CTAs  

### Content Strategy
- Natural slang integration (not forced)
- Problem-solution-CTA flow
- Social proof and trust signals
- Local relevance (city-specific content)
- Action-oriented language

## 🔧 Customization

### Modifying Templates

Edit the template functions in `generator.mjs`:
- `renderEnglishPageTemplate()` - English page structure
- `renderSpanishPageTemplate()` - Spanish page structure
- `generateServicesList()` - Service items list

### Adding More Slang

Edit `seo/slang.json`:

```json
{
  "english": ["new-slang-term"],
  "spanish": ["nuevo-término-slang"]
}
```

### Changing Service Translations

Edit the `translateService()` function in `generator.mjs` to add/modify Spanish translations.

## ⚠️ Important Notes

### Repository Size
- Generated pages are NOT committed to the repository by default
- Use `.gitignore` to exclude generated pages if needed
- Generate pages during deployment or on-demand

### Routing Integration
The generated pages work with existing React Router configuration:
- Route pattern: `/services/:service/:city`
- Spanish route: `/services/:service/:city/es`
- Ensure App.jsx includes the appropriate routes

## 📞 Support

For questions or issues:
- Check the main project README
- Review this documentation
- Contact the development team

## 📄 License

Part of the Fixlo application. All rights reserved.

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Pages Generated**: 1,000
