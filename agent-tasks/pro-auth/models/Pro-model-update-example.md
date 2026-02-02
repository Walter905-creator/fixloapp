# Pro Model Update Example

This document shows how to update the existing `Pro.js` model to add missing fields for professional profiles.

## Fields to Add

Add these fields to your existing Pro schema before the closing bracket:

```javascript
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
```

## Note

This implementation was already added to the existing `Pro.js` model in this repository. No additional changes are needed if using the updated model.
