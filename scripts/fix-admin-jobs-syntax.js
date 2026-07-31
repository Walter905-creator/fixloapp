'use strict';

const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'client', 'src', 'routes', 'AdminJobsPage.jsx');
let source = fs.readFileSync(target, 'utf8');

const malformedAuthorization = /'Authorization':\s*`[^\n]*\n\s*'Content-Type':\s*'application\/json'/;
const correctedAuthorization = "'Authorization': `Bearer ${token}`,\n          'Content-Type': 'application/json'";

if (malformedAuthorization.test(source)) {
  source = source.replace(malformedAuthorization, correctedAuthorization);
  fs.writeFileSync(target, source);
  console.log('✅ Corrected AdminJobsPage authorization header syntax');
} else if (source.includes("'Authorization': `Bearer ${token}`,")) {
  console.log('✅ AdminJobsPage authorization header syntax already correct');
} else {
  throw new Error('Could not locate the AdminJobsPage authorization header block');
}
