import fs from 'fs';

const content = fs.readFileSync('api/index.ts', 'utf-8');

// Helper to extract a block given a regex start and end. 
// But an AST parser is better to not mess up brackets.
// Actually, it's easier to just create the files since I have the contents in my context.
