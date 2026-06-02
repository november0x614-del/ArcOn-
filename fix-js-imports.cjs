const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./api');
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  // Match relative imports that don't have an extension
  // It handles: from './something' or from "../something"
  const newContent = content.replace(/(from\s+["'])(\.\.?\/[^"']+)(["'])/g, (match, prefix, p1, suffix) => {
    if (p1.endsWith('.js') || p1.includes('.json') || p1.endsWith('.ts')) {
      return match;
    }
    return `${prefix}${p1}.js${suffix}`;
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`[Fix] Updated ${file}`);
  }
});

// Also check server.ts
try {
  let serverContent = fs.readFileSync('./server.ts', 'utf8');
  const newServerContent = serverContent.replace(/(from\s+["'])(\.\.?\/[^"']+)(["'])/g, (match, prefix, p1, suffix) => {
    if (p1.endsWith('.js') || p1.includes('.json') || p1.endsWith('.ts')) {
      return match;
    }
    return `${prefix}${p1}.js${suffix}`;
  });
  if (serverContent !== newServerContent) {
    fs.writeFileSync('./server.ts', newServerContent);
    console.log(`[Fix] Updated server.ts`);
  }
} catch (e) {}

console.log('Finished fixing .js imports (added extensions)');
