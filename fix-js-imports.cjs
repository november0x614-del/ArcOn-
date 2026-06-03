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
  // replace relative imports to have .js at the end
  content = content.replace(/from\s+['"](\..*?)(?:\.js)?['"]/g, 'from "$1.js"');
  fs.writeFileSync(file, content);
});
console.log('Fixed .js imports');
