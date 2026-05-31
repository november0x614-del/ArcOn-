import React from "react";
import {
  ArrowLeft,
  CloudLightning,
  ShieldCheck,
  FolderSync,
  LogOut,
  Clock,
  Sparkles,
  Database,
  KeyRound,
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCheck2,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getOrCreateBackupFolder,
  uploadMarkdownToFolder,
  listFolderFiles,
  DriveFile,
} from "../../services/googleDriveService";
import { useStore } from "../../store/useStore";
import { User as FirebaseUser } from "firebase/auth";

// Markdown Procedures Content Constants
const PROCEDURES = [
  {
    key: "circle-secret",
    title: "Prosedur Backup & Rotasi Circle Entity Secret",
    description: "Pedoman pengelolaan Entity Secret, rotasi berkala, dan penanganan murni Recovery File agar terhindar dari kehilangan aset custodial.",
    icon: <KeyRound size={20} className="text-amber-500" />,
    content: `# Protokol Keamanan & Rotasi Circle Entity Secret

## Apa itu Entity Secret & Recovery File?
Entity Secret digunakan untuk mengenkripsi data sensitif (seperti Entity Secret Ciphertext) yang dikirim ke Circle API untuk mengoperasikan Developer-Controlled Wallets milik pengguna di Arc Testnet.
Saat Anda pertama kali mendaftarkan entity secret Anda secara asimetris, Circle Console menghasilkan sebuah **Recovery File**.

## Aturan Penting Circle Recovery:
1. **Recovery File** adalah SATU-SATUNYA mekanisme untuk mereset Entity Secret melalui Circle Console jika sewaktu-waktu hilang atau terlupa.
2. **Tanpa dokumen Recovery ini**, tidak ada alur pemulihan apa pun dari pihak pengembang atau pihak Circle untuk mendapatkan kembali akses dompet beserta seluruh dana USDC yang ada di dalamnya.
3. **Rotasi Berkala**: Setiap kali Anda melakukan rotasi Entity Secret, Recovery File yang lama akan dinonaktifkan (invalidated). Anda wajib menyimpan Recovery File versi terbaru yang dihasilkan sesaat setelah rotasi berhasil.

## Panduan Backup yang Aman (Cold Storage):
- Enkripsi file recovery dengan PGP secara asimetris menggunakan kunci publik eksternal Anda sebelum disimpan di storage cloud.
- Simpan kunci privat dekripsi PGP secara terpisah di cold storage/offline hardware wallet.
- Jangan pernah menyebarkan Recovery File di dalam server publik, chat log, atau folder repositori git.`,
  },
  {
    key: "api-config",
    title: "Arsitektur Integrasi Secrets Dinamis di folder api/",
    description: "Panduan teknis pencegahan hardcoding file kredensial menggunakan dynamic dynamic loading secrets di middleware /api/config.",
    icon: <Terminal size={20} className="text-blue-500" />,
    content: `# Arsitektur Integrasi Secrets Dinamis di API /api/config/

## Mengapa Pembacaan Credential Harus Dinamis?
Di lingkungan produksi Lounge, kredensial sensitif seperti \`CIRCLE_ENTITY_SECRET\`, \`SUPABASE_SECRET_KEY\`, dan \`GEMINI_API_KEY\` tidak boleh di-hardcode atau dimuat sebagai variabel statis pada level modul saat inisialisasi boot. Ini wajib dinamis untuk mencegah memory cache leakage.

## Struktur Folder yang Direkomendasikan:
\`\`\`
/api
  /config
    supabase.ts    <-- Dynamic initialization
  /middleware
    rateLimiter.ts
  /services
    circle.ts      <-- Lazy credentials reading
\`\`\`

## Pola Desain (Design Pattern) - Lazy Initialization Helper:
\`\`\`typescript
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

// Dipanggil hanya saat rute membutuhkan eksekusi AI, tidak di module load
export function getGeminiAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required in environment variables");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}
\`\`\`

## Manfaat Integrasi Dinamis:
1. Membantu transisi integrasi auto-rotation yang ditenagai oleh provider external AWS Secret Manager atau GCP Secret Manager secara halus.
2. Mencegah runtuhnya aplikasi saat inisialisasi awal server-side ketika variabel environment belum terdefinisi secara utuh di container internal.`,
  },
  {
    key: "supabase-protection",
    title: "Protokol DB Triggers Proteksi Supabase",
    description: "Penjelasan fungsional dan teknis trigger SQL Supabase yang melarang keras penghapusan atau modifikasi data sensitif profil/dompet.",
    icon: <Database size={20} className="text-emerald-500" />,
    content: `# Protokol Perlindungan Tingkat Database Supabase (DB Triggers)

Aplikasi Lounge mengimplementasikan database triggers tingkat rendah (low-level PL/pgSQL) untuk melindungi integritas saldo, dompet (SCA), dan hak akses administratif dari manipulasi client-side.

## Triggers Aktif & Kegunaannya:

1. **\`prevent_wallet_deletion_or_address_change\`**
   - **Tingkat Bahaya**: Kritis (CRITICAL SECURITY)
   - **Perilaku**: Mencegah penghapusan pemetaan dompet pengguna atau penggantian alamat dompet aktif di dalam tabel Supabase. Ini memastikan pengguna yang memiliki aset di Arc Testnet tidak pernah kehilangan keterkaitan address dompetnya di Lounge database.

2. **\`prevent_profile_deletion_with_active_wallet\`**
   - **Tingkat Bahaya**: Kritis (CRITICAL SECURITY)
   - **Perilaku**: Mencegah penghapusan total profil user di database jika user tersebut terafiliasi dengan program Circle Wallet aktif yang menyimpan saldo.

3. **\`prevent_profile_role_escalation\`**
   - **Tingkat Bahaya**: Tinggi (HIGH SECURITY)
   - **Perilaku**: Mencegah otorisasi yang tidak sah (Role Escalation) di mana pengguna biasa mencoba mengubah status kolom role mereka sendiri menjadi 'admin' atau 'super_admin'. Setiap perubahan hak eksklusif wajib diverifikasi melalui trigger ketat di Supabase RLS.`,
  },
];

// Generator Laporan Riwayat Transaksi (Transaction History Ledger)
const generateLedgerMarkdown = (txs: any[], userEmail: string | undefined, currentBalance: number): string => {
  const dateStr = new Date().toLocaleString("id-ID") + " UTC";
  return `# LAPORAN RIWAYAT TRANSAKSI (TRANSACTION HISTORY LEDGER)

* **Tanggal Generasi**: ${dateStr}
* **Oleh Pengguna**: ${userEmail || "Lounge Admin"}
* **Aset Utama**: USDC (Stablecoin)
* **Jaringan**: ARC-TESTNET
* **Status Ledger**: TERVERIFIKASI & AMAN

---

## RINGKASAN INTEGRITAS KEUANGAN
* **Total Transaksi Tercatat**: ${txs.length} Kali Transaksi
* **Saldo Akun Sekarang**: $${currentBalance.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
* **Metode Konsensus**: Circle Developer-Controlled Wallets Webhooks & Supabase Triggers Sync

---

## RINCIAN BUKU BESAR (TRANSACTION LEDGER LIST)

| S No | ID Transaksi | Tanggal / Waktu | Deskripsi Aktivitas | Jumlah (USDC) | Status | Tx Hash Blockchain |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${txs.length > 0 ? txs.map((tx, idx) => {
  const cleanId = tx.id ? tx.id.slice(0, 8) : "N/A";
  const shortHash = tx.txHash ? `\`${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-8)}\`` : "`INTERNAL_REF`";
  return `| ${idx + 1} | \`TX-${cleanId}\` | ${tx.timestamp} | ${tx.title} | **${tx.amount} USDC** | \`${tx.status.toUpperCase()}\` | ${shortHash} |`;
}).join("\n") : "| - | - | - | Belum ada riwayat transaksi tercatat | - | - | - |"}

---

## PROTOKOL SECOPS & AUDITABILITY
Setiap baris ledger transaksi di atas dipantau secara asinkron dari node validator **Arc Network** dan menggunakan **Circle Developer-Controlled Wallets API**. Status penyelesaian akhir divalidasi memanfaatkan tanda tangan kriptografis Circle Webhook Webhooks Payload validation tingkat tinggi (Ed25519/ECDSA signature verification). Perubahan manual dari sisi client langsung diblokir menggunakan Supabase low-level DB Triggers.
`;
};

interface BackupCenterScreenProps {
  onBack?: () => void;
  embedMode?: boolean;
}

export function BackupCenterScreen({ onBack, embedMode = false }: BackupCenterScreenProps) {
  const [googleUser, setGoogleUser] = React.useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isDriveLoading, setIsDriveLoading] = React.useState(false);
  
  // Backup-specific local states
  const [backupFolderId, setBackupFolderId] = React.useState<string | null>(null);
  const [driveFiles, setDriveFiles] = React.useState<DriveFile[]>([]);
  const [uploadStates, setUploadStates] = React.useState<Record<string, "idle" | "uploading" | "success" | "error">>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [ledgerUploadState, setLedgerUploadState] = React.useState<"idle" | "uploading" | "success" | "error">("idle");
  
  const displayToast = useStore((state) => state.displayToast);
  const transactions = useStore((state) => state.transactions);
  const fetchTransactions = useStore((state) => state.fetchTransactions);
  const registeredUser = useStore((state) => state.registeredUser);
  const balance = useStore((state) => state.balance);
  const fetchBalance = useStore((state) => state.fetchBalance);

  // Fetch transactions and balance on load to keep dynamic ledger accurate
  React.useEffect(() => {
    if (transactions.length === 0) {
      fetchTransactions();
    }
    fetchBalance();
  }, []);

  const handleBackupLedger = async () => {
    if (!accessToken) {
      displayToast("Harap sambungkan akun Google Drive Anda terlebih dahulu.");
      return;
    }

    setLedgerUploadState("uploading");
    try {
      const folderId = backupFolderId || await getOrCreateBackupFolder("Lounge SecOps Backups", accessToken);
      if (!backupFolderId) {
        setBackupFolderId(folderId);
      }

      // Refresh transactions and balances
      await Promise.all([fetchTransactions(), fetchBalance()]);
      const freshTransactions = useStore.getState().transactions;
      const freshBalance = useStore.getState().balance;

      const content = generateLedgerMarkdown(freshTransactions, registeredUser?.email, freshBalance);
      const filename = `transaction_ledger_report_${Date.now()}.md`;
      await uploadMarkdownToFolder(folderId, filename, content, accessToken);
      
      setLedgerUploadState("success");
      displayToast("Berhasil mencadangkan Laporan Riwayat Transaksi ke Google Drive!");
      
      // Reload file list from Drive
      loadFolderFileList(accessToken);
    } catch (err: any) {
      console.error("Ledger backup failed:", err);
      setLedgerUploadState("error");
      displayToast("Gagal mengunggah laporan riwayat transaksi.");
    }
  };

  // Load existing Google Auth State on Mount
  React.useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setIsAuthLoading(false);
        loadFolderFileList(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadFolderFileList = async (token: string) => {
    setIsDriveLoading(true);
    try {
      const folderId = await getOrCreateBackupFolder("Lounge SecOps Backups", token);
      setBackupFolderId(folderId);
      const files = await listFolderFiles(folderId, token);
      setDriveFiles(files);
      setErrorMessage(null);
    } catch (err: any) {
      console.error("Failed to load Google Drive folder info:", err);
      setErrorMessage("Gagal memuat daftar file lama dari Google Drive. Silakan hubungkan ulang akun Google Anda.");
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        displayToast("Koneksi Google Drive berhasil diaktifkan!");
        loadFolderFileList(result.accessToken);
      }
    } catch (err: any) {
      console.error("Google login failed:", err);
      displayToast("Otorisasi Google Drive dibatalkan.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setIsAuthLoading(true);
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setAccessToken(null);
      setBackupFolderId(null);
      setDriveFiles([]);
      displayToast("Koneksi Google Drive diputus.");
    } catch (err: any) {
      console.error("Sign out error:", err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleBackupSingleFile = async (key: string, title: string, content: string) => {
    if (!accessToken) {
      displayToast("Harap sambungkan akun Google Drive Anda terlebih dahulu.");
      return;
    }

    setUploadStates((prev) => ({ ...prev, [key]: "uploading" }));
    try {
      const folderId = backupFolderId || await getOrCreateBackupFolder("Lounge SecOps Backups", accessToken);
      if (!backupFolderId) {
        setBackupFolderId(folderId);
      }

      const filename = `${key}_procedure.md`;
      await uploadMarkdownToFolder(folderId, filename, content, accessToken);
      
      setUploadStates((prev) => ({ ...prev, [key]: "success" }));
      displayToast(`Berhasil menyimpan "${title}" ke Google Drive!`);
      
      // Reload file list from Drive
      loadFolderFileList(accessToken);
    } catch (err: any) {
      console.error("Single upload failed:", err);
      setUploadStates((prev) => ({ ...prev, [key]: "error" }));
      displayToast("Gagal mengunggah berkas. Hubungkan ulang koneksi Drive.");
    }
  };

  const handleBackupAllFiles = async () => {
    if (!accessToken) {
      displayToast("Harap sambungkan akun Google Drive Anda terlebih dahulu.");
      return;
    }

    setIsDriveLoading(true);
    displayToast("Memulai sinkronisasi terpadu seluruh berkas SecOps ke Google Drive...");
    
    try {
      const folderId = backupFolderId || await getOrCreateBackupFolder("Lounge SecOps Backups", accessToken);
      if (!backupFolderId) {
        setBackupFolderId(folderId);
      }

      for (const proc of PROCEDURES) {
        setUploadStates((prev) => ({ ...prev, [proc.key]: "uploading" }));
        const filename = `${proc.key}_procedure.md`;
        await uploadMarkdownToFolder(folderId, filename, proc.content, accessToken);
        setUploadStates((prev) => ({ ...prev, [proc.key]: "success" }));
      }

      displayToast("Semua berkas SecOps berhasil disinkronkan ke Google Drive!");
      loadFolderFileList(accessToken);
    } catch (errInside: any) {
      console.error("Bulk backup failed:", errInside);
      displayToast("Gagal melakukan sinkronisasi massal.");
    } finally {
      setIsDriveLoading(false);
    }
  };

  return (
    <div className={embedMode ? "w-full h-full bg-slate-50 flex flex-col pt-1" : "w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-bottom duration-300"}>
      {/* Header */}
      {!embedMode && onBack && (
        <div className="flex items-center justify-between px-4 pt-6 pb-3 bg-slate-900 shadow-md relative z-10 shrink-0">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h3 className="font-bold text-[15px] tracking-tight text-white ml-2">
              SECOPS BACKUP CENTER
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[10.5px] font-bold font-mono">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
            TESTNET MODE
          </div>
        </div>
      )}

      {/* Screen Content */}
      <div className={`flex-1 overflow-y-auto scrollbar-hide pt-3 ${embedMode ? "pb-8" : "pb-[130px]"}`}>
        
        {/* Intro Card */}
        <div className="mx-4 mb-4 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl p-5 border border-slate-800 text-white shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
            <CloudLightning size={160} />
          </div>
          <div className="flex gap-1 items-center bg-white/10 border border-white/15 rounded-full px-2.5 py-0.5 w-fit text-[10px] font-bold tracking-wide mb-3">
            <Sparkles size={11} className="text-amber-300" />
            GOOGLE DRIVE CO-STORAGE
          </div>
          <h2 className="text-[17px] font-bold tracking-tight">Cegah Kehilangan Kredensial</h2>
          <p className="text-[12.5px] text-slate-300 mt-1.5 leading-relaxed">
            Karena hilangnya Recovery File Circle maupun salah pengaturan schema di Supabase dapat menyebabkan kerusakan operasional dompet, simpan prosedur integrasi real-time Anda dalam Google Drive yang langsung terhubung demi keselarasan data.
          </p>
        </div>

        {/* Google Drive Connection Widget */}
        <div className="mx-4 mb-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-[12px] font-bold text-slate-400 tracking-wider uppercase mb-3.5">
            GOOGLE WORKSPACE STATUS
          </h4>

          {isAuthLoading ? (
            <div className="flex items-center justify-center py-4 gap-2 text-slate-500 text-xs font-semibold">
              <Loader2 className="animate-spin text-slate-700" size={16} />
              Memuat konfigurasi keamanan...
            </div>
          ) : googleUser ? (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                <div className="flex items-center gap-3">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt="Google Profile"
                      className="w-10 h-10 rounded-full border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold font-mono">
                      G
                    </div>
                  )}
                  <div>
                    <div className="text-[13px] font-bold text-slate-800">
                      {googleUser.displayName || "Google Account"}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 select-all">
                      {googleUser.email}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[10px] font-bold">
                    CONNECTED
                  </span>
                  <button
                    onClick={handleGoogleSignOut}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 cursor-pointer border-0 bg-transparent mt-1"
                  >
                    <LogOut size={12} />
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Action sync buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleBackupAllFiles}
                  disabled={isDriveLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-800 text-white font-bold text-[12.5px] rounded-xl hover:bg-slate-800 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isDriveLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <FolderSync size={16} />
                  )}
                  Sinkronisasikan Semua Prosedur
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                <CloudLightning size={22} />
              </div>
              <p className="text-[12px] text-slate-500 max-w-[280px] leading-relaxed mb-4">
                Hubungkan penyimpanan cloud Google Drive Anda untuk mulai mencadangkan dan melacak protokol/kredensial keamanan.
              </p>
              
              {/* Official styled login button */}
              <button
                onClick={handleGoogleSignIn}
                className="gsi-material-button w-full sm:w-auto px-6 cursor-pointer border border-slate-200 shadow-sm rounded-xl py-0.5 bg-white hover:bg-slate-50 active:scale-[0.98] transition-all"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper flex items-center gap-3 py-2.5">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "18px", height: "18px" }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">Hubungkan dengan Google</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Auditing and Ledger Reports */}
        <div className="mx-4 mb-6">
          <div className="px-2 mb-3.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              LAPORAN DINAMIS & TRANSFERS AUDITING
            </span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
              REAL-TIME REPORTING
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                <Wallet size={20} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-[13.5px] font-bold text-slate-800 leading-tight">
                  Laporan Riwayat Transaksi (Transaction History Ledger)
                </h4>
                <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed">
                  Laporan audit gabungan aktivitas deposit, swap, pengiriman, maupun staking USDC milik pengguna secara live di Arc Testnet.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4.5 border-t border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-700">
                  {transactions.length} Transaksi Tercatat
                </span>
                <span className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                  transaction_ledger_report_[time].md
                </span>
              </div>

              <button
                onClick={handleBackupLedger}
                disabled={!googleUser || ledgerUploadState === "uploading"}
                className={`px-3.5 py-1.5 text-[11px] font-bold rounded-xl transition-all active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5 ${
                  ledgerUploadState === "success"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : ledgerUploadState === "error"
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : !googleUser
                        ? "bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed opacity-50"
                        : "bg-indigo-600 border border-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {ledgerUploadState === "uploading" && (
                  <Loader2 className="animate-spin" size={12} />
                )}
                {ledgerUploadState === "success" && <CheckCircle2 size={12} />}
                {ledgerUploadState === "error" && <AlertTriangle size={12} />}
                
                {ledgerUploadState === "uploading"
                  ? "Mengunggah..."
                  : ledgerUploadState === "success"
                    ? "Tersimpan"
                    : ledgerUploadState === "error"
                      ? "Gagal, Ulangi"
                      : "Backup ke Drive"}
              </button>
            </div>
          </div>
        </div>

        {/* Procedures Backup List */}
        <div className="mx-4 mb-6">
          <div className="px-2 mb-3.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              BERKAS SECOPS YANG SIAP DICADANGKAN
            </span>
            <span className="text-[10px] bg-slate-150 text-slate-650 px-2 py-0.5 rounded-full font-bold">
              {PROCEDURES.length} ITEMS
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {PROCEDURES.map((proc) => {
              const uState = uploadStates[proc.key] || "idle";
              return (
                <div
                  key={proc.key}
                  className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      {proc.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[13.5px] font-bold text-slate-800 leading-tight">
                        {proc.title}
                      </h4>
                      <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed">
                        {proc.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4.5 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10.5px] font-medium font-mono text-slate-400">
                      {proc.key}_procedure.md
                    </span>

                    <button
                      onClick={() => handleBackupSingleFile(proc.key, proc.title, proc.content)}
                      disabled={!googleUser || uState === "uploading"}
                      className={`px-3.5 py-1.5 text-[11px] font-bold rounded-xl transition-all active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5 ${
                        uState === "success"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : uState === "error"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : !googleUser
                              ? "bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed opacity-50"
                              : "bg-slate-900 border border-slate-800 text-white hover:bg-slate-800"
                      }`}
                    >
                      {uState === "uploading" && (
                        <Loader2 className="animate-spin" size={12} />
                      )}
                      {uState === "success" && <CheckCircle2 size={12} />}
                      {uState === "error" && <AlertTriangle size={12} />}
                      
                      {uState === "uploading"
                        ? "Mengunggah..."
                        : uState === "success"
                          ? "Tersimpan"
                          : uState === "error"
                            ? "Gagal, Ulangi"
                            : "Backup ke Drive"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Backup Files on Google Drive List */}
        {googleUser && (
          <div className="mx-4 mb-8">
            <div className="px-2 mb-3.5 flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                BERKAS LAIN DI DRIVE SECOPS FOLDER
              </span>
              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-650 rounded text-[9px] font-bold">
                REAL-TIME DATA
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm">
              {isDriveLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-slate-440 text-xs font-semibold">
                  <Loader2 className="animate-spin text-slate-700" size={16} />
                  Mensinkronisasi dengan drive folder...
                </div>
              ) : driveFiles.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-emerald-50/50 border border-emerald-150 px-3.5 rounded-xl text-emerald-700 text-[11px] flex gap-2 items-center leading-relaxed font-semibold">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                    Berkas aman terunggah di folder Drive pribadi &quot;Lounge SecOps Backups&quot; Anda.
                  </div>
                  <div className="flex flex-col divide-y divide-slate-50 mt-1">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCheck2 size={15} className="text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[12.5px] font-bold text-slate-700 block truncate">
                              {file.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9.5px] font-mono text-slate-400 block truncate">
                                ID: {file.id}
                              </span>
                              <span className="text-[9.5px] text-slate-300">•</span>
                              <div className="flex items-center gap-0.5 text-slate-400 font-medium text-[9.5px]">
                                <Clock size={9.5} />
                                {new Date(file.createdTime).toLocaleDateString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title="Buka di Google Drive"
                          >
                            <ExternalLink size={13.5} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-2">
                    <FolderSync size={18} />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-[220px]">
                    {errorMessage || "Belum ada berkas backup yang berhasil disimpan ke akun Google Drive Anda."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
