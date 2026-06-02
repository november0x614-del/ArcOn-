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
  // Match relative imports and add .js
  let newContent = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
    if (p1.endsWith('.js') || p1.endsWith('.ts')) {
      return match;
    }
    return `from "${p1}.js"`;
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
  }
});
console.log('Fixed .js imports');
