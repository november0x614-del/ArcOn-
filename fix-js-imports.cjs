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
  content = content.replace(/(from\s+["'])(\.\.?\/[^"']+)(["'])/g, (match, prefix, p1, suffix) => {
    if (p1.endsWith('.js') || p1.includes('.json') || p1.endsWith('.ts')) {
      return match;
    }
    return `${prefix}${p1}.js${suffix}`;
  });
  fs.writeFileSync(file, content);
});
console.log('Fixed .js imports (added extensions)');
