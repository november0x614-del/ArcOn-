const fs = require('fs');
const files = [
  './src/components/screens/AdminDashboardScreen.tsx',
  './src/components/admin/UsersTab.tsx',
  './src/components/admin/InfrastructureTab.tsx',
  './api/services/circle.ts',
  './api/routes/transaction.routes.ts',
  './api/routes/misc.routes.ts',
  './api/routes/admin.routes.ts',
  './api/routes/ecommerce.routes.ts',
  './api/config/supabase.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (file.startsWith('./src/')) {
    content = content.replace(/"11111111-1111-1111-1111-111111111111"/g, "(import.meta.env.VITE_PLATFORM_ADMIN_UUID || '')");
  } else {
    content = content.replace(/"11111111-1111-1111-1111-111111111111"/g, "(process.env.PLATFORM_ADMIN_UUID as string)");
  }
  fs.writeFileSync(file, content);
}
console.log('UUID replaced successfully');
