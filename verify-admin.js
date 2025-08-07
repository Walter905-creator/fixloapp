// Simple test to verify admin functionality
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Fixlo Admin Setup...\n');

// Check required files
const requiredFiles = ['server.js', 'admin.html', 'package.json'];
const missingFiles = [];

requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`✅ ${file} found`);
    } else {
        console.log(`❌ ${file} missing`);
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.log(`\n❌ Missing files: ${missingFiles.join(', ')}`);
    process.exit(1);
}

// Check environment variables
console.log('\n🔧 Environment Configuration:');
console.log(`   PORT: ${process.env.PORT || 'Not set (will use 3000)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'Not set (will use default)'}`);
console.log(`   ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? '[SET]' : 'Not set (will use default)'}`);

// Test server syntax
console.log('\n🔍 Testing server.js syntax...');
try {
    require('./server.js');
    console.log('❌ Server started instead of syntax check');
} catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.log('✅ Server syntax appears valid (missing dependencies is expected)');
    } else {
        console.log(`❌ Server syntax error: ${error.message}`);
        process.exit(1);
    }
}

console.log('\n🚀 Admin setup verification complete!');
console.log('\n📋 Next steps:');
console.log('1. Make sure your environment variables are properly set');
console.log('2. Run: npm install (if needed)');
console.log('3. Run: node server.js');
console.log('4. Visit: http://localhost:3001/admin');
console.log('5. Use your configured admin credentials to log in');

console.log('\n🔐 Default credentials (if not configured):');
console.log('   Email: admin@fixloapp.com');
console.log('   Password: FixloAdmin2024!');
