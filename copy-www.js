/**
 * Script to synchronize web assets from project root into www/ directory
 * for Capacitor native packaging.
 */

const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const targetDir = path.join(__dirname, 'www');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const filesToCopy = [
    'index.html',
    'style.css',
    'script.js'
];

const dirsToCopy = [
    'database',
    'services',
    'reports',
    'assets',
    'images'
];

// Copy files
filesToCopy.forEach(file => {
    const src = path.join(srcDir, file);
    const dest = path.join(targetDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file} -> www/${file}`);
    }
});

// Copy directories recursively
function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

dirsToCopy.forEach(dir => {
    const src = path.join(srcDir, dir);
    const dest = path.join(targetDir, dir);
    if (fs.existsSync(src)) {
        copyDirRecursive(src, dest);
        console.log(`Copied directory ${dir} -> www/${dir}`);
    }
});

console.log('Successfully synced all web assets to www/');
