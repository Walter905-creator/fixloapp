#!/bin/bash

# Pre-render canonical URLs for main routes
# This script updates the index.html template with route-specific canonical URLs

ROUTES=(
  "/"
  "/how-it-works"
  "/contact"
  "/signup"
  "/services"
  "/services/plumbing"
  "/services/electrical"
  "/services/hvac"
  "/services/carpentry"
  "/services/painting"
  "/services/roofing"
  "/services/house-cleaning"
  "/services/junk-removal"
  "/services/landscaping"
  "/pro/signup"
  "/ai-assistant"
  "/terms"
)

TITLES=(
  "Fixlo – Book Trusted Home Services Near You"
  "How It Works - Fixlo"
  "Contact Us - Fixlo"
  "Sign Up - Fixlo"
  "Home Services - Professional Contractors | Fixlo"
  "Plumbing Services - Find Trusted Professionals | Fixlo"
  "Electrical Services - Find Trusted Professionals | Fixlo"
  "HVAC Services - Find Trusted Professionals | Fixlo"
  "Carpentry Services - Find Trusted Professionals | Fixlo"
  "Painting Services - Find Trusted Professionals | Fixlo"
  "Roofing Services - Find Trusted Professionals | Fixlo"
  "House Cleaning Services - Find Trusted Professionals | Fixlo"
  "Junk Removal Services - Find Trusted Professionals | Fixlo"
  "Landscaping Services - Find Trusted Professionals | Fixlo"
  "Professional Sign Up - Join Fixlo Network"
  "AI Assistant - Fixlo Home Services"
  "Terms of Service - Fixlo"
)

BUILD_DIR="."
TEMPLATE_FILE="$BUILD_DIR/index.html"

echo "🔧 Pre-rendering canonical URLs for SEO..."

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "❌ Build file not found. Please run 'npm run build' first."
  exit 1
fi

# Create backup if it doesn't exist (or recreate from current build)
if [ ! -f "$BUILD_DIR/index.html.original" ]; then
  cp "$TEMPLATE_FILE" "$BUILD_DIR/index.html.original"
else
  # Update the original to match current build assets
  cp "$TEMPLATE_FILE" "$BUILD_DIR/index.html.original"
fi

# Update homepage canonical in the main template (work with current build, not old original)
sed -i "s|<title>[^<]*</title>|<title>Fixlo – Book Trusted Home Services Near You</title>|g" "$TEMPLATE_FILE"

# Ensure homepage has correct canonical
if grep -q 'rel="canonical"' "$TEMPLATE_FILE"; then
  sed -i "s|<link rel=\"canonical\" href=\"[^\"]*\"[^>]*>|<link rel=\"canonical\" href=\"https://www.fixloapp.com/\"/>|g" "$TEMPLATE_FILE"
else
  sed -i "s|</head>|  <link rel=\"canonical\" href=\"https://www.fixloapp.com/\"/>\n&|" "$TEMPLATE_FILE"
fi

# Generate route-specific HTML files
for i in "${!ROUTES[@]}"; do
  route="${ROUTES[i]}"
  title="${TITLES[i]}"
  
  # Skip root route (already handled above)
  if [ "$route" = "/" ]; then
    continue
  fi
  
  # Calculate canonical URL (remove trailing slash except for root)
  canonical_path="$route"
  if [[ "$route" != "/" && "$route" =~ /$ ]]; then
    canonical_path="${route%/}"
  fi
  canonical_url="https://www.fixloapp.com$canonical_path"
  
  # Create directory if needed
  route_dir="$BUILD_DIR$route"
  if [[ "$route" != *".html" ]]; then
    mkdir -p "$route_dir"
    target_file="$route_dir/index.html"
  else
    target_file="$BUILD_DIR$route"
  fi
  
  # Copy current build template and update (not the old original)
  cp "$TEMPLATE_FILE" "$target_file"
  
  # Update title first (escape special characters)
  escaped_title=$(printf '%s\n' "$title" | sed 's/[[\.*^$()+?{|]/\\&/g')
  sed -i "s|<title>[^<]*</title>|<title>$escaped_title</title>|g" "$target_file"
  
  # Replace existing canonical URL with the correct one
  if grep -q 'rel="canonical"' "$target_file"; then
    sed -i "s|<link rel=\"canonical\" href=\"[^\"]*\"[^>]*>|<link rel=\"canonical\" href=\"$canonical_url\"/>|g" "$target_file"
  else
    # Insert new canonical before </head> if none exists
    sed -i "s|</head>|  <link rel=\"canonical\" href=\"$canonical_url\"/>\n&|" "$target_file"
  fi
  
  # Update Open Graph URL to match canonical
  if grep -q 'property="og:url"' "$target_file"; then
    sed -i "s|<meta property=\"og:url\" content=\"[^\"]*\"[^>]*>|<meta property=\"og:url\" content=\"$canonical_url\">|g" "$target_file"
  fi
  
  echo "✅ Generated: $target_file (canonical: $canonical_url)"
done

echo "🎉 Pre-rendering complete! Generated HTML files with route-specific canonical URLs."