import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function generateAndSaveSecret() {
  console.log('🔄 Memulai proses pembuatan Entity Secret...');

  // 1. Generate 32-byte hex string (64 karakter) menggunakan API kriptografi internal Node.js
  const entitySecret = crypto.randomBytes(32).toString('hex');
  console.log(`✅ Entity Secret Kriptografis Berhasil Dibuat: ${entitySecret.substring(0, 8)}...[REDACTED]`);

  // 2. Tentukan lokasi file .env di root proyek
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // 3. Regex untuk mencari deklarasi CIRCLE_ENTITY_SECRET yang sudah ada
  const envVarName = 'CIRCLE_ENTITY_SECRET';
  const secretRegex = new RegExp(`^${envVarName}=.*$`, 'm');

  if (secretRegex.test(envContent)) {
    // Timpa key lama jika sudah ada
    envContent = envContent.replace(secretRegex, `${envVarName}="${entitySecret}"`);
    console.log(`🔄 Mengganti value ${envVarName} yang lama di file .env`);
  } else {
    // Tambahkan baris baru jika belum ada
    envContent += `\n${envVarName}="${entitySecret}"\n`;
    console.log(`➕ Menambahkan ${envVarName} ke dalam file .env`);
  }

  // 4. Tulis kembali ke file
  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  console.log('🔒 Secret berhasil disimpan ke .env. Pastikan file .env ada di dalam .gitignore!');
}

generateAndSaveSecret();
