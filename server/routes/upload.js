const express = require('express');
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploadedResponse = await cloudinary.uploader.upload(fileStr, {
      folder: 'fixlo-pros',
    });
    res.json({ url: uploadedResponse.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;