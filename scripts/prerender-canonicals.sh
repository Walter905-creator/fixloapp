#!/bin/bash

# Pre-render canonical URLs for main routes
# This script updates the index.html template with route-specific canonical URLs

ROUTES=(
  "/"
  "/how-it-works"
  "/contact"
  "/services"
  "/services/plumbing"
  "/services/electrical"
  "/services/hvac"
  "/services/carpentry"
  "/services/painting"
  "/services/roofing"
  "/services/house-cleaning"
  "/services/landscaping"
)

TITLES=(
  "Fixlo – Book Trusted Home Services Near You"
  "How It Works - Fixlo"
  "Contact Us - Fixlo"
  "Home Services - Professional Contractors | Fixlo"
  "Plumbing Services - Find Trusted Professionals | Fixlo"
  "Electrical Services - Find Trusted Professionals | Fixlo"
  "HVAC Services - Find Trusted Professionals | Fixlo"
  "Carpentry Services - Find Trusted Professionals | Fixlo"
  "Painting Services - Find Trusted Professionals | Fixlo"
  "Roofing Services - Find Trusted Professionals | Fixlo"
  "House Cleaning Services - Find Trusted Professionals | Fixlo"
  "Landscaping Services - Find Trusted Professionals | Fixlo"
)

BUILD_DIR="client/build"
TEMPLATE_FILE="$BUILD_DIR/index.html"

echo "🔧 Pre-rendering canonical URLs for SEO..."

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "❌ Build file not found. Please run 'npm run build' first."
  exit 1
fi

# Create backup
cp "$TEMPLATE_FILE" "$BUILD_DIR/index.html.backup"

# Generate route-specific HTML files
for i in "${!ROUTES[@]}"; do
  route="${ROUTES[i]}"
  title="${TITLES[i]}"
  
  # Skip root route (already correct)
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
  
  # Copy template and update canonical and title
  cp "$TEMPLATE_FILE" "$target_file"
  
  # Update canonical URL
  sed -i "s|<link rel=\"canonical\" href=\"https://www.fixloapp.com/\"/>|<link rel=\"canonical\" href=\"$canonical_url\"/>|g" "$target_file"
  
  # Update title
  sed -i "s|<title>Fixlo – Book Trusted Home Services Near You</title>|<title>$title</title>|g" "$target_file"
  
  echo "✅ Generated: $target_file (canonical: $canonical_url)"
done

echo "🎉 Pre-rendering complete! Generated HTML files with route-specific canonical URLs."