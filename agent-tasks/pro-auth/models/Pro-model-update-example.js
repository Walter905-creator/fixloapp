// Example: How to update existing Pro.js model to add missing fields
// Add these fields to your existing Pro schema before the closing bracket

// Professional portfolio
profileImage: {
  type: String, // Cloudinary URL
  default: null
},
gallery: [{
  type: String // Array of Cloudinary URLs for work photos
}],
reviews: [{ 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Review' 
}]

// Note: This implementation was already added to the existing Pro.js model in this repository
// No additional changes needed if using the updated model