#!/bin/bash

# Pre-render canonical URLs for main routes with enhanced SEO
# This script updates the index.html template with route-specific canonical URLs, titles, descriptions, and content

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
  "/about-walter-arevalo"
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
  "Walter Arevalo | Founder & CEO of Fixlo"
)

DESCRIPTIONS=(
  "Fixlo connects homeowners with trusted, verified home service professionals. Book plumbing, electrical, HVAC, cleaning, and more. Fast, reliable, and affordable home services."
  "Learn how Fixlo works. Post your home service request, get matched with verified professionals, and book the right expert for your needs. Simple, fast, and reliable."
  "Contact Fixlo support team. Get help with your home service requests, professional account, or general inquiries. We're here to help you 24/7."
  "Sign up for Fixlo as a homeowner. Post service requests, browse professionals, and get your home projects done by trusted experts in your area."
  "Browse all home services on Fixlo. Find verified professionals for plumbing, electrical, HVAC, cleaning, landscaping, and more. Quality service guaranteed."
  "Find trusted plumbing professionals on Fixlo. Get quotes for leak repairs, drain cleaning, water heater installation, and all plumbing services. Licensed and insured plumbers."
  "Hire licensed electricians on Fixlo. Get help with wiring, outlets, panel upgrades, lighting installation, and electrical repairs. Safe and certified electrical services."
  "Book HVAC professionals on Fixlo. AC repair, heating installation, duct cleaning, and maintenance services. Stay comfortable year-round with expert HVAC technicians."
  "Find skilled carpenters on Fixlo. Custom cabinets, deck building, trim work, and woodworking projects. Quality carpentry services from experienced professionals."
  "Hire professional painters on Fixlo. Interior and exterior painting, cabinet refinishing, and color consultation. Transform your space with expert painting services."
  "Book roofing contractors on Fixlo. Roof repair, replacement, inspection, and maintenance. Protect your home with quality roofing from certified professionals."
  "Find house cleaning services on Fixlo. Regular cleaning, deep cleaning, move-in/out services. Reliable and thorough cleaning professionals for your home."
  "Book junk removal services on Fixlo. Furniture removal, appliance disposal, estate cleanouts, and debris hauling. Fast and affordable junk removal."
  "Hire landscaping professionals on Fixlo. Lawn care, garden design, tree trimming, and outdoor maintenance. Beautiful landscapes from experienced landscapers."
  "Join Fixlo as a home service professional. Get more clients, manage your business, and grow your revenue. Sign up free and start receiving service requests."
  "Get personalized home service recommendations with Fixlo AI Assistant. Find the right professional for your project with intelligent matching and instant quotes."
  "Read Fixlo Terms of Service. Understand our platform policies, user agreements, and service guidelines. Transparent and fair terms for all users."
  "Meet Walter Arevalo, founder and CEO of Fixlo. Learn about his vision to revolutionize home services and connect homeowners with trusted professionals."
)

BUILD_DIR="."
TEMPLATE_FILE="$BUILD_DIR/index.html"

echo "🔧 Pre-rendering canonical URLs, titles, descriptions, and structured data for enhanced SEO..."

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

# Add fallback title, description, and canonical to homepage
# First remove any existing tags to avoid duplicates
sed -i '/<title>/d' "$TEMPLATE_FILE"
sed -i '/<link rel="canonical"/d' "$TEMPLATE_FILE"
sed -i '/<meta name="description"/d' "$TEMPLATE_FILE"
sed -i '/<meta name="robots"/d' "$TEMPLATE_FILE"

# Then add the homepage meta tags before the comment
sed -i "s|<!-- Title, description, robots, canonical, and social|<title>Fixlo – Book Trusted Home Services Near You</title>\n    <meta name=\"description\" content=\"Fixlo connects homeowners with trusted, verified home service professionals. Book plumbing, electrical, HVAC, cleaning, and more. Fast, reliable, and affordable home services.\" />\n    <meta name=\"robots\" content=\"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1\" />\n    <link rel=\"canonical\" href=\"https://www.fixloapp.com/\" />\n    <!-- Title, description, robots, canonical, and social|" "$TEMPLATE_FILE"

# Add structured data for homepage (Organization schema) - using a temp file approach
cat > /tmp/homepage_schema.txt << 'SCHEMA_EOF'
    <script type="application/ld+json">
{"@context": "https://schema.org", "@type": "Organization", "name": "Fixlo", "url": "https://www.fixloapp.com", "logo": "https://www.fixloapp.com/logo.png", "description": "Fixlo connects homeowners with trusted, verified home service professionals"}
</script>
SCHEMA_EOF
sed -i "/<\/head>/i $(cat /tmp/homepage_schema.txt)" "$TEMPLATE_FILE"
rm /tmp/homepage_schema.txt

# Generate route-specific HTML files with enhanced SEO
for i in "${!ROUTES[@]}"; do
  route="${ROUTES[i]}"
  title="${TITLES[i]}"
  description="${DESCRIPTIONS[i]}"
  
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
  
  # Remove any existing meta tags first to avoid duplicates
  sed -i '/<title>/d' "$target_file"
  sed -i '/<link rel="canonical"/d' "$target_file"
  sed -i '/<meta name="description"/d' "$target_file"
  sed -i '/<meta name="robots"/d' "$target_file"
  
  # Escape special characters in title and description
  escaped_title=$(printf '%s\n' "$title" | sed 's/[[\.*^$()+?{|]/\\&/g')
  escaped_description=$(printf '%s\n' "$description" | sed 's/[[\.*^$()+?{|]/\\&/g' | sed 's/"/\\"/g')
  
  # Add title, description, robots, and canonical as fallback (React Helmet will override these dynamically if needed)
  sed -i "s|<!-- Title, description, robots, canonical, and social|<title>$escaped_title</title>\n    <meta name=\"description\" content=\"$escaped_description\" />\n    <meta name=\"robots\" content=\"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1\" />\n    <link rel=\"canonical\" href=\"$canonical_url\" />\n    <!-- Title, description, robots, canonical, and social|" "$target_file"
  
  # Add route-specific structured data (simplified single-line JSON)
  if [[ "$route" == /services/* ]] && [[ "$route" != "/services" ]]; then
    # Service-specific schema
    service_name=$(basename "$route" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
    # Create temp file for schema
    cat > /tmp/service_schema.txt << SCHEMA_EOF
    <script type="application/ld+json">
{"@context": "https://schema.org", "@type": "Service", "serviceType": "$service_name", "provider": {"@type": "Organization", "name": "Fixlo"}, "areaServed": {"@type": "Country", "name": "United States"}}
</script>
SCHEMA_EOF
    sed -i "/<\/head>/i $(cat /tmp/service_schema.txt)" "$target_file"
    rm /tmp/service_schema.txt
  fi
  
  # Add static SEO content in noscript tag for crawlers
  cat > /tmp/noscript_content.txt << 'NOSCRIPT_EOF'
    <noscript>
      <div style="padding: 20px; max-width: 1200px; margin: 0 auto; font-family: sans-serif;">
        <h1>PAGE_TITLE_PLACEHOLDER</h1>
        <p>PAGE_DESC_PLACEHOLDER</p>
        <p><strong>Please enable JavaScript to use Fixlo.</strong></p>
        <p><a href="https://www.fixloapp.com">Return to Homepage</a></p>
      </div>
    </noscript>
NOSCRIPT_EOF
  # Replace placeholders
  sed -i "s|PAGE_TITLE_PLACEHOLDER|$title|g" /tmp/noscript_content.txt
  sed -i "s|PAGE_DESC_PLACEHOLDER|$description|g" /tmp/noscript_content.txt
  # Insert noscript before </body>
  sed -i "/<\/body>/i $(cat /tmp/noscript_content.txt)" "$target_file"
  rm /tmp/noscript_content.txt
  
  echo "✅ Generated: $target_file (canonical: $canonical_url)"
done

echo "🎉 Pre-rendering complete! Generated HTML files with:"
echo "   - Route-specific canonical URLs and titles"
echo "   - Unique meta descriptions for each page"
echo "   - Structured data (JSON-LD) for better indexing"
echo "   - Static content in noscript tags for crawlers"
echo "   - Enhanced robots meta tags"