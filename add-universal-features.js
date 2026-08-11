/**
 * Script to add universal features to all HTML pages
 * Adds: accessibility, dark mode, language switcher, and music player
 */

const fs = require('fs');
const path = require('path');

// Features to check for
const requiredFeatures = {
    styles: [
        { name: 'theme-styles.css', pattern: /theme-styles\.css/ },
        { name: 'accessibility-styles.css', pattern: /accessibility-styles\.css/ },
        { name: 'i18n-styles.css', pattern: /i18n-styles\.css/ }
    ],
    scripts: [
        { name: 'cosmic-music-player.js', pattern: /cosmic-music-player\.js/ },
        { name: 'theme-toggle.js', pattern: /theme-toggle\.js/ },
        { name: 'accessibility.js', pattern: /accessibility\.js/ },
        { name: 'i18n.js', pattern: /i18n\.js/ }
    ]
};

// Get all HTML files
function getAllHtmlFiles(dir = '.') {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'public' && item !== 'android-app' && item !== 'ios-app') {
            files.push(...getAllHtmlFiles(fullPath));
        } else if (stat.isFile() && item.endsWith('.html') && !item.includes('_scraped') && !item.includes('_new') && !item.includes('test-')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Add missing features to a file
function addFeaturesToFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check and add styles
    const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
        let headContent = headMatch[1];
        
        // Add theme-styles.css
        if (!requiredFeatures.styles[0].pattern.test(headContent)) {
            const lastLink = headContent.match(/<link[^>]*>/g)?.pop();
            if (lastLink) {
                const insertPos = headContent.lastIndexOf(lastLink) + lastLink.length;
                headContent = headContent.slice(0, insertPos) + 
                    '\n    <link rel="stylesheet" href="theme-styles.css">' + 
                    headContent.slice(insertPos);
                modified = true;
            }
        }
        
        // Add accessibility-styles.css
        if (!requiredFeatures.styles[1].pattern.test(headContent)) {
            const lastLink = headContent.match(/<link[^>]*>/g)?.pop();
            if (lastLink) {
                const insertPos = headContent.lastIndexOf(lastLink) + lastLink.length;
                headContent = headContent.slice(0, insertPos) + 
                    '\n    <link rel="stylesheet" href="accessibility-styles.css">' + 
                    headContent.slice(insertPos);
                modified = true;
            }
        }
        
        // Add i18n-styles.css
        if (!requiredFeatures.styles[2].pattern.test(headContent)) {
            const lastLink = headContent.match(/<link[^>]*>/g)?.pop();
            if (lastLink) {
                const insertPos = headContent.lastIndexOf(lastLink) + lastLink.length;
                headContent = headContent.slice(0, insertPos) + 
                    '\n    <link rel="stylesheet" href="i18n-styles.css">' + 
                    headContent.slice(insertPos);
                modified = true;
            }
        }
        
        // Add scripts
        const scripts = [];
        
        // Add i18n.js (should be early)
        if (!requiredFeatures.scripts[3].pattern.test(headContent)) {
            scripts.push({ name: 'i18n.js', position: 'early' });
            modified = true;
        }
        
        // Add cosmic-music-player.js
        if (!requiredFeatures.scripts[0].pattern.test(headContent)) {
            scripts.push({ name: 'cosmic-music-player.js', position: 'normal' });
            modified = true;
        }
        
        // Add theme-toggle.js
        if (!requiredFeatures.scripts[1].pattern.test(headContent)) {
            scripts.push({ name: 'theme-toggle.js', position: 'normal' });
            modified = true;
        }
        
        // Add accessibility.js
        if (!requiredFeatures.scripts[2].pattern.test(headContent)) {
            scripts.push({ name: 'accessibility.js', position: 'normal' });
            modified = true;
        }
        
        // Insert scripts
        if (scripts.length > 0) {
            const lastScript = headContent.match(/<script[^>]*>[\s\S]*?<\/script>/g)?.pop() || 
                              headContent.match(/<script[^>]*src=["'][^"']+["'][^>]*>/g)?.pop();
            
            if (lastScript) {
                const insertPos = headContent.lastIndexOf(lastScript) + lastScript.length;
                const scriptTags = scripts.map(s => `    <script src="${s.name}" defer></script>`).join('\n');
                headContent = headContent.slice(0, insertPos) + '\n' + scriptTags + headContent.slice(insertPos);
            } else {
                // No scripts found, add before </head>
                const scriptTags = scripts.map(s => `    <script src="${s.name}" defer></script>`).join('\n');
                headContent = headContent + '\n' + scriptTags;
            }
            modified = true;
        }
        
        // Update content
        if (modified) {
            content = content.replace(/<head[^>]*>([\s\S]*?)<\/head>/i, `<head>${headContent}</head>`);
        }
    }
    
    return { content, modified };
}

// Main execution
const htmlFiles = getAllHtmlFiles();
console.log(`Found ${htmlFiles.length} HTML files`);

let updatedCount = 0;
for (const file of htmlFiles) {
    try {
        const result = addFeaturesToFile(file);
        if (result.modified) {
            fs.writeFileSync(file, result.content, 'utf8');
            console.log(`Updated: ${file}`);
            updatedCount++;
        }
    } catch (error) {
        console.error(`Error processing ${file}:`, error.message);
    }
}

console.log(`\nUpdated ${updatedCount} files`);

