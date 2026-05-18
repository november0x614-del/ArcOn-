import { generateEntitySecret, registerEntitySecretCiphertext } from '@circle-fin/developer-controlled-wallets';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function main() {
  console.log('🔄 Memulai proses Setup Entity Secret Circle...');

  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey) {
    console.error('❌ ERROR: CIRCLE_API_KEY tidak ditemukan di .env');
    process.exit(1);
  }

  // Langkah 1: Generate Entity Secret
  const entitySecret = generateEntitySecret();
  console.log('\n✅ 1. Berhasil membuat Entity Secret Baru.');
  console.log('⚠️ SIMPAN SECRET INI SECARA AMAN (tambahkan ke vault atau .env):');
  console.log(`CIRCLE_ENTITY_SECRET="${entitySecret}"\n`);

  // Langkah 2: Register Entity Secret ke Circle
  try {
    console.log('⏳ 2. Mendaftarkan Entity Secret ke Circle...');
    const response = await registerEntitySecretCiphertext({
      apiKey,
      entitySecret,
      recoveryFileDownloadPath: path.resolve('./recovery'),
      // The recovery file will be saved as something like ./recovery/recovery_file.dat
    });

    console.log('✅ Berhasil didaftarkan!');
    console.log('📂 File Recovery disimpan di folder: ./recovery');
    console.log('🔒 Harap simpan file recovery di tempat yang aman (jangan masuk ke repositori).');
    
  } catch (error) {
    console.error('❌ Gagal meregistrasi Entity Secret:', error);
  }
}

main();
