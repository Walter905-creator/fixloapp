const fs = require('fs');
if (fs.existsSync('index.html')) {
  console.error('❌ Found root index.html. This will shadow CRA build. Remove it.');
  process.exit(1);
}