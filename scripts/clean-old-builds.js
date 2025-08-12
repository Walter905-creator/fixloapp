#!/usr/bin/env node

/**
 * Clean Old Build Artifacts Script
 * Removes outdated static assets while keeping the latest build
 */

const fs = require('fs');
const path = require('path');

const staticJsDir = path.join(__dirname, '..', 'static', 'js');
const staticCssDir = path.join(__dirname, '..', 'static', 'css');

function cleanOldAssets(dir, extension) {
    if (!fs.existsSync(dir)) {
        console.log(`📁 Directory ${dir} does not exist, skipping...`);
        return;
    }

    const files = fs.readdirSync(dir)
        .filter(file => file.startsWith('main.') && file.endsWith(extension))
        .map(file => ({
            name: file,
            path: path.join(dir, file),
            stat: fs.statSync(path.join(dir, file))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime); // Sort by modification time, newest first

    if (files.length <= 1) {
        console.log(`✅ ${extension} files: ${files.length} file(s), no cleanup needed`);
        return;
    }

    console.log(`🧹 Found ${files.length} ${extension} files, keeping the latest and removing ${files.length - 1} old files`);
    
    // Keep the newest file, remove the rest
    const filesToRemove = files.slice(1);
    
    filesToRemove.forEach(file => {
        try {
            fs.unlinkSync(file.path);
            console.log(`   🗑️  Removed: ${file.name}`);
        } catch (error) {
            console.error(`   ❌ Failed to remove ${file.name}:`, error.message);
        }
    });

    console.log(`✅ Kept latest: ${files[0].name}`);
}

console.log('🧹 Cleaning old build artifacts...\n');

cleanOldAssets(staticJsDir, '.js');
cleanOldAssets(staticCssDir, '.css');

// Also clean up license and map files that don't have corresponding JS files
if (fs.existsSync(staticJsDir)) {
    const jsFiles = fs.readdirSync(staticJsDir)
        .filter(file => file.endsWith('.js') && !file.endsWith('.LICENSE.txt'))
        .map(file => file.replace('.js', ''));

    const licenseFiles = fs.readdirSync(staticJsDir)
        .filter(file => file.endsWith('.LICENSE.txt'));

    licenseFiles.forEach(licenseFile => {
        const baseName = licenseFile.replace('.LICENSE.txt', '');
        if (!jsFiles.includes(baseName)) {
            try {
                fs.unlinkSync(path.join(staticJsDir, licenseFile));
                console.log(`🗑️  Removed orphaned license file: ${licenseFile}`);
            } catch (error) {
                console.error(`❌ Failed to remove ${licenseFile}:`, error.message);
            }
        }
    });
}

console.log('\n✅ Build artifact cleanup completed!');