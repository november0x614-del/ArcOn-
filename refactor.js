import fs from 'fs';
import path from 'path';

const replaceInFile = (filePath) => {
  const absolutePath = path.resolve(filePath);
  let content = fs.readFileSync(absolutePath, 'utf-8');
  content = content.replace(/ArcAppKitAdapter/g, 'BackendClient');
  content = content.replace(/\/services\/arc-app-kit\/adapter/g, '/services/api/index');
  content = content.replace(/\.\.\/services\/arc-app-kit\/adapter/g, '../services/api/index');
  fs.writeFileSync(absolutePath, content);
  console.log(`Replaced in ${filePath}`);
};

const files = [
  'src/components/screens/BridgeScreen.tsx',
  'src/components/screens/StablestakeScreen.tsx',
  'src/components/screens/SwapScreen.tsx',
  'src/components/router/ViewRouter.tsx',
  'src/hooks/useBalances.ts',
  'src/services/api/index.ts'
];

files.forEach(replaceInFile);
