#!/bin/bash

# Pre-render canonical URLs for main routes
# This script updates the index.html template with route-specific canonical URLs and titles

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

echo "🔧 Pre-rendering canonical URLs and titles for SEO..."

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

# Add fallback title and canonical to homepage
# First remove any existing title and canonical tags to avoid duplicates
sed -i '/<title>/d' "$TEMPLATE_FILE"
sed -i '/<link rel="canonical"/d' "$TEMPLATE_FILE"
# Then add the homepage title and canonical before the comment
sed -i "s|<!-- Title, description, robots, canonical, and social|<title>Fixlo – Book Trusted Home Services Near You</title>\n    <link rel=\"canonical\" href=\"https://www.fixloapp.com/\" />\n    <!-- Title, description, robots, canonical, and social|" "$TEMPLATE_FILE"

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
  
  # Remove any existing title and canonical tags first to avoid duplicates
  sed -i '/<title>/d' "$target_file"
  sed -i '/<link rel="canonical"/d' "$target_file"
  
  # Add title and canonical as fallback (React Helmet will override these dynamically if needed)
  # Escape special characters in title
  escaped_title=$(printf '%s\n' "$title" | sed 's/[[\.*^$()+?{|]/\\&/g')
  sed -i "s|<!-- Title, description, robots, canonical, and social|<title>$escaped_title</title>\n    <link rel=\"canonical\" href=\"$canonical_url\" />\n    <!-- Title, description, robots, canonical, and social|" "$target_file"
  
  echo "✅ Generated: $target_file (canonical: $canonical_url)"
done

echo "🎉 Pre-rendering complete! Generated HTML files with route-specific canonical URLs and titles."