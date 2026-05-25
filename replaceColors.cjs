const fs = require('fs');
const path = require('path');

function replaceColors(dirPath) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceColors(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Replacements
            // backgrounds
            content = content.replace(/bg-\[#3FA2F6\]/g, 'bg-slate-900');
            content = content.replace(/bg-blue-600/g, 'bg-slate-800');
            content = content.replace(/hover:bg-\[#2b88d8\]/g, 'hover:bg-slate-800');
            content = content.replace(/bg-\[#008fcd\]/g, 'bg-slate-900');
            content = content.replace(/hover:bg-\[#007dba\]/g, 'hover:bg-slate-800');
            content = content.replace(/from-\[#3FA2F6\]/g, 'from-slate-800');
            content = content.replace(/to-blue-600/g, 'to-slate-900');
            // borders
            content = content.replace(/border-\[#3FA2F6\]/g, 'border-slate-900');
            content = content.replace(/focus:border-\[#3FA2F6\]/g, 'focus:border-slate-400');
            content = content.replace(/focus-within:border-\[#3FA2F6\]/g, 'focus-within:border-slate-400');
            content = content.replace(/hover:border-\[#3FA2F6\]/g, 'hover:border-slate-400');
            // texts
            content = content.replace(/text-\[#3FA2F6\]/g, 'text-slate-800');
            content = content.replace(/hover:text-blue-600/g, 'hover:text-slate-600');
            content = content.replace(/text-blue-500/g, 'text-slate-600');
            
            // special shadows specific to buttons
            content = content.replace(/shadow-\[0_4px_14px_rgba\(63,162,246,0\.3\)\]/g, 'shadow-lg');
            content = content.replace(/shadow-\[0_6px_20px_rgba\(63,162,246,0\.4\)\]/g, 'shadow-xl');
            content = content.replace(/shadow-\[0_4px_14px_rgba\(0,143,205,0\.4\)\]/g, 'shadow-lg');
            content = content.replace(/shadow-\[0_6px_20px_rgba\(0,143,205,0\.5\)\]/g, 'shadow-xl');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Modified:', fullPath);
            }
        }
    });
}

replaceColors('./src');
