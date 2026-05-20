const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// 1. Check structure
console.log('=== Checking public/ structure ===');
try {
    const items = fs.readdirSync(publicDir);
    console.log('public/ contents:', items);
} catch (e) {
    console.log('ERROR reading public/:', e.message);
}

// Check index.html
const indexPath = path.join(publicDir, 'index.html');
console.log('index.html exists:', fs.existsSync(indexPath));

// Check static
const staticDir = path.join(publicDir, 'static');
console.log('static/ exists:', fs.existsSync(staticDir));

if (fs.existsSync(staticDir)) {
    console.log('static/ contents:', fs.readdirSync(staticDir));
    
    const cssDir = path.join(staticDir, 'css');
    const jsDir = path.join(staticDir, 'js');
    
    if (fs.existsSync(cssDir)) console.log('static/css/ contents:', fs.readdirSync(cssDir));
    if (fs.existsSync(jsDir)) console.log('static/js/ contents:', fs.readdirSync(jsDir));
}

// 2. Fix permissions recursively
console.log('\n=== Fixing permissions ===');
function fixPerms(dir) {
    let fixed = 0;
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    fs.chmodSync(fullPath, 0o755);
                    fixed++;
                    fixed += fixPerms(fullPath);
                } else {
                    fs.chmodSync(fullPath, 0o644);
                    fixed++;
                }
            } catch (e) {
                console.log('Error fixing:', fullPath, e.message);
            }
        }
    } catch (e) {
        console.log('Error reading dir:', dir, e.message);
    }
    return fixed;
}

const totalFixed = fixPerms(publicDir);
console.log(`Fixed permissions for ${totalFixed} files/dirs`);

// 3. Verify
console.log('\n=== Verification ===');
try {
    const cssFiles = fs.readdirSync(path.join(publicDir, 'static', 'css'));
    console.log('CSS files accessible:', cssFiles);
    
    const jsFiles = fs.readdirSync(path.join(publicDir, 'static', 'js'));
    console.log('JS files accessible:', jsFiles);
    
    console.log('\n✅ All good! Restart the app now.');
} catch (e) {
    console.log('❌ Still have issues:', e.message);
}

process.exit(0);
