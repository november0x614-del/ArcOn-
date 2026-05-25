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

            content = content.replace(/after:to-\[#3FA2F6\]/g, 'after:to-slate-800');
            content = content.replace(/focus-within:ring-\[#3FA2F6\]/g, 'focus-within:ring-slate-900');
            content = content.replace(/shadow-\[0_0_15px_4px_#3FA2F6\]/g, 'shadow-[0_0_15px_4px_#0f172a]');
            content = content.replace(/border-blue-100/g, 'border-slate-200');
            content = content.replace(/bg-blue-50/g, 'bg-slate-100');
            content = content.replace(/text-blue-600/g, 'text-slate-800');
            content = content.replace(/text-blue-500/g, 'text-slate-600');
            content = content.replace(/text-\[#005faa\]/g, 'text-slate-800');
            content = content.replace(/hover:bg-blue-100/g, 'hover:bg-slate-200');
            content = content.replace(/bg-\[#008fcd\]/g, 'bg-slate-900');
            content = content.replace(/hover:bg-\[#007dba\]/g, 'hover:bg-slate-800');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    });
}
replaceColors('./src');
