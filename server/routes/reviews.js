const express = require('express');
const router = express.Router();

let reviews = [];

router.post('/', (req, res) => {
  const { proId, reviewerName, rating, comment } = req.body;
  reviews.push({ proId, reviewerName, rating, comment, date: new Date() });
  res.json({ success: true });
});

router.get('/:proId', (req, res) => {
  const proReviews = reviews.filter(r => r.proId === req.params.proId);
  res.json(proReviews);
});

module.exports = router;