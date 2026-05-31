import { getSupabaseAdmin } from "../api/config/supabase";
import { getCircleClientInstance, circleApiFetch } from "../api/services/circleClient";
import * as dotenv from "dotenv";

dotenv.config();

async function runRecovery() {
  console.log("=========================================");
  console.log("🔒 LOUNGE SECURE LEDGER RECOVERY SYSTEM 🔒");
  console.log("=========================================");

  const args = process.argv.slice(2);
  const command = args[0];

  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch all users from Supabase Auth
    console.log("🔄 Menghubungi Supabase Auth untuk menarik daftar pengguna...");
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Gagal menarik daftar pengguna auth: ${authError.message}`);
    }
    console.log(`✅ Berhasil menarik ${users.length} pengguna terdaftar di Supabase Auth.`);

    // 2. Fetch all mapped wallets in DB
    const { data: dbWallets, error: dbWalletsError } = await supabase
      .from("user_wallets")
      .select("*");
    
    if (dbWalletsError) {
      throw new Error(`Gagal membaca tabel user_wallets: ${dbWalletsError.message}`);
    }
    
    // 3. Fetch all profiles in DB
    const { data: dbProfiles, error: dbProfilesError } = await supabase
      .from("profiles")
      .select("*");
    
    if (dbProfilesError) {
      throw new Error(`Gagal membaca tabel profiles: ${dbProfilesError.message}`);
    }

    console.log(`📊 Status Database Saat Ini:`);
    console.log(`   - Profil Pengguna (profiles): ${dbProfiles?.length || 0} entri`);
    console.log(`   - Pemetaan Dompet (user_wallets): ${dbWallets?.length || 0} entri\n`);

    // ==========================================
    // ACTION: REPAIR MISSING PROFILES
    // ==========================================
    if (command === "--repair-profiles" || !command) {
      console.log("🛡️  Pemeriksaan & Pemulihan Tabel Profiles...");
      let repairedCount = 0;

      for (const authUser of users) {
        const hasProfile = dbProfiles?.some(p => p.id === authUser.id);
        if (!hasProfile) {
          console.log(`⚠️  User ${authUser.email} (${authUser.id}) kehilangan profil di public.profiles. Memulihkan...`);
          
          const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.username || "Arc User";
          const username = authUser.user_metadata?.username || `user_${authUser.id.substring(0, 8)}`;
          const avatarUrl = authUser.user_metadata?.avatar_url || null;

          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: fullName,
              username: username,
              avatar_url: avatarUrl,
              role: "user"
            });

          if (insertError) {
            console.error(`❌ Gagal memulihkan profil untuk ${authUser.email}:`, insertError.message);
          } else {
            console.log(`✅ Profil untuk ${authUser.email} berhasil dipulihkan.`);
            repairedCount++;
          }
        }
      }
      console.log(`🎉 Pemulihan profil selesai. ${repairedCount} profil berhasil dipulihkan.\n`);
    }

    // ==========================================
    // ACTION: SCAN ORPHANED WALLETS ON CIRCLE
    // ==========================================
    console.log("🔍 Menghubungi Circle API untuk memindai dompet yang aktif...");
    
    const foundCircleWallets: any[] = [];
    try {
      const response = await circleApiFetch("/v1/w3s/wallets?pageSize=50");
      const wallets = response.data?.wallets || [];
      for (const w of wallets) {
        foundCircleWallets.push({
          walletId: w.id,
          address: w.address,
          walletSetId: w.walletSetId,
          blockchain: w.blockchain,
          createDate: w.createDate,
          state: w.state
        });
      }
    } catch (err: any) {
      console.error("⚠️  Gagal menarik daftar dompet dari API Circle:", err.message);
    }

    console.log(`✅ Berhasil menarik ${foundCircleWallets.length} dompet dari Circle API.`);

    // Match between Circle wallets and Database mappings to find orphaned wallets
    const orphanedWallets = foundCircleWallets.filter(circleW => {
      return !dbWallets?.some(dbW => dbW.wallet_address.toLowerCase() === circleW.address.toLowerCase());
    });

    console.log(`⚠️  Ditemukan ${orphanedWallets.length} dompet di Circle yang TIDAK terpetakan di lokal database (Orphaned Wallets):`);
    orphanedWallets.forEach((w, index) => {
      console.log(`   [${index + 1}] Wallet ID: ${w.walletId}`);
      console.log(`       Address:   ${w.address}`);
      console.log(`       Set ID:    ${w.walletSetId}`);
      console.log(`       Created:   ${w.createDate}`);
    });
    console.log("");

    // ==========================================
    // ACTION: MANUALLY CONNECT AN ORPHANED WALLET TO A USER
    // ==========================================
    if (command === "--link" && args.length >= 5) {
      const targetUserId = args[1];
      const targetWalletId = args[2];
      const targetAddress = args[3];
      const targetWalletSetId = args[4];

      console.log(`🛡️  Memulai pemetaan paksa (Force Re-link) untuk User: ${targetUserId}...`);
      
      // Verify user exists in auth
      const userExists = users.some(u => u.id === targetUserId);
      if (!userExists) {
        throw new Error(`User ID ${targetUserId} tidak ditemukan di Supabase Auth.`);
      }

      // Check if user already has a mapped wallet
      const existingMapping = dbWallets?.find(w => w.id === targetUserId);
      if (existingMapping) {
        console.log(`⚠️  Pengguna ini sudah memiliki pemetaan dompet aktif: ${existingMapping.wallet_address}`);
        console.log("   Sistem akan menghapus pemetaan lama terlebih dahulu dan menimpanya demi aset lama.");
        const { error: deleteError } = await supabase
          .from("user_wallets")
          .delete()
          .eq("id", targetUserId);
        
        if (deleteError) {
          throw new Error(`Gagal menghapus pemetaan lama: ${deleteError.message}`);
        }
      }

      // Insert new secure mapping
      const { error: insertMapError } = await supabase
        .from("user_wallets")
        .insert({
          id: targetUserId,
          wallet_id: targetWalletId,
          wallet_address: targetAddress,
          wallet_set_id: targetWalletSetId
        });

      if (insertMapError) {
        throw new Error(`Gagal memetakan dompet baru ke database: ${insertMapError.message}`);
      }

      console.log(`🎉 RE-LINK SUKSES!`);
      console.log(`   User:           ${targetUserId}`);
      console.log(`   Alamat Dompet:  ${targetAddress}`);
      console.log(`   ID Dompet:     ${targetWalletId}`);
      console.log(`   ID Set Dompet:  ${targetWalletSetId}`);
      console.log(`\nSilakan refresh aplikasi Anda. Pengguna akan langsung mendapatkan kembali akses ke dompet lamanya beserta seluruh saldonya!`);
    } else {
      console.log("💡 TIPS PEMULIHAN MANUAL (RE-LINK):");
      console.log("   Jika Anda mengenali dompet lama Anda dari daftar Orphaned Wallets di atas, Hubungkan kembali dengan menjalankan:");
      console.log("   npx tsx scripts/recover_mappings.ts --link <USER_ID> <WALLET_ID> <WALLET_ADDRESS> <WALLET_SET_ID>\n");
    }

  } catch (error: any) {
    console.error("\n❌ PROSES PEMULIHAN GAGAL:");
    console.error(error.message);
  }
}

runRecovery();
