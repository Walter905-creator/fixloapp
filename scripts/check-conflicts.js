// scripts/check-conflicts.js
const { execSync } = require('child_process');

try {
  // scan only tracked files; ignore node_modules and build outputs
  // Look specifically for git conflict markers that start a line
  const grep = execSync(
    `git grep -n -E "^<<<<<<<[[:space:]]|^=======$|^>>>>>>>[[:space:]]" -- . ":(exclude)node_modules/*" ":(exclude)client/build/*"`,
    { stdio: 'pipe' }
  ).toString().trim();

  if (grep) {
    console.error('Found unresolved merge conflicts:\n');
    console.error(grep);
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (e) {
  // git grep returns non‑zero when no matches; treat that as success
  process.exit(0);
}