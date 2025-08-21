// Simple test to validate the proxy fix
const express = require('express');
const cors = require('cors');

const app = express();

// CORS setup for localhost:3000 (where React dev server runs)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Mount subscribe routes
const subscribeRouter = require('./routes/subscribe');
app.use('/api/subscribe', subscribeRouter);

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server running' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log('🔗 Try: curl http://localhost:3001/api/health');
  console.log('🔗 Try: curl -X POST http://localhost:3001/api/subscribe/checkout -H "Content-Type: application/json" -d \'{"email":"test@test.com"}\'');
});