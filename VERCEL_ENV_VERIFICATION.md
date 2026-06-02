# 🔍 Vercel Environment Variables Verification Guide

## ⚠️ **Problem Diagnosis**
- ✅ Build berhasil di Vercel → Frontend variables OK
- ❌ Login gagal → Missing server-side environment variables
- 🔴 Penyebab: Backend Express.js tidak menerima `VITE_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`

---

## 📊 **Variables Breakdown**

### **🟢 Frontend Variables (VITE_) - Embedded saat BUILD**
Harus di-set di Vercel sebelum build:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ARC_RPC_URL
VITE_ARC_CHAIN_ID
VITE_ARC_CURRENCY_SYMBOL
VITE_ARC_EXPLORER_URL
VITE_ADMIN_EMAIL
GEMINI_API_KEY (di-inject via vite.config.ts line 11)
```

### **🔴 Backend Variables (Non-VITE) - Dibutuhkan saat RUNTIME**
Harus di-set di Vercel untuk production:
```
SUPABASE_SERVICE_ROLE_KEY ⭐ CRITICAL untuk login
CIRCLE_API_KEY
CIRCLE_ENTITY_SECRET
CIRCLE_WEBHOOK_PUBLIC_KEY
CIRCLE_BLOCKCHAIN
KIT_KEY
PRIVATE_KEY
ADMIN_EMAIL
ADMIN_SECRET
ARC_RPC_URL
ARC_MASTER_MNEMONIC
ARC_HOT_WALLET_ADDRESS
ARC_USDC_CONTRACT
PLATFORM_TREASURY_ADDRESS
```

---

## ✅ **Step-by-Step Verification**

### **1️⃣ Login ke Vercel Dashboard**
```
https://vercel.com/dashboard
└─ Pilih: november0x614-del/ArcOn-
   └─ Settings → Environment Variables
```

### **2️⃣ Verifikasi Frontend Variables**

| Variable | Expected | Status | Notes |
|----------|----------|--------|-------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | ⏳ | File: `src/lib/supabaseClient.ts:4` |
| `VITE_SUPABASE_ANON_KEY` | Public anon key | ⏳ | File: `src/lib/supabaseClient.ts:6` |
| `VITE_ARC_RPC_URL` | `https://rpc.testnet.arc.network` | ⏳ | File: `.env.example:24` |
| `VITE_ARC_CHAIN_ID` | `5042002` | ⏳ | File: `.env.example:25` |
| `VITE_ARC_CURRENCY_SYMBOL` | `USDC` | ⏳ | File: `.env.example:26` |
| `VITE_ARC_EXPLORER_URL` | `https://testnet.arcscan.app` | ⏳ | File: `.env.example:27` |
| `VITE_ADMIN_EMAIL` | `admin@admin.com` | ⏳ | File: `.env.example:20` |
| `GEMINI_API_KEY` | Your Gemini API Key | ⏳ | File: `vite.config.ts:11` |

### **3️⃣ Verifikasi Backend Variables (CRITICAL)**

| Variable | Expected | Status | Used In | Priority |
|----------|----------|--------|---------|----------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | ⏳ | `api/config/supabase.ts:10` | 🔴 CRITICAL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | ⏳ | `api/config/supabase.ts:23` | 🔴 CRITICAL |
| `CIRCLE_API_KEY` | Circle API Key | ⏳ | `api/services/circleClient.ts` | 🔴 CRITICAL |
| `CIRCLE_ENTITY_SECRET` | Entity Secret | ⏳ | Wallet creation | 🟠 HIGH |
| `CIRCLE_WEBHOOK_PUBLIC_KEY` | Public webhook key | ⏳ | Webhook verification | 🟠 HIGH |
| `CIRCLE_BLOCKCHAIN` | `ARC-TESTNET` | ⏳ | `api/services/circle.ts` | 🟠 HIGH |
| `PRIVATE_KEY` | Your private key | ⏳ | Transaction signing | 🟠 HIGH |
| `PLATFORM_TREASURY_ADDRESS` | Treasury wallet address | ⏳ | `api/services/circle.ts:455` | 🟡 MEDIUM |
| `ADMIN_SECRET` | Admin secret token | ⏳ | Admin routes protection | 🟡 MEDIUM |

---

## 🚀 **How to Set Variables in Vercel**

### **Method 1: Web UI (Recommended)**
1. Go to Project Settings → Environment Variables
2. Paste setiap variable satu per satu
3. Select Environment: **Production** (dan Preview jika perlu)
4. Click **Add**

### **Method 2: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set individual variable
vercel env add VITE_SUPABASE_URL
# Output will prompt you to paste the value

# Or edit .env.local dan run
vercel env pull
```

### **Method 3: .env.production File** (⚠️ NOT RECOMMENDED for secrets)
```bash
# Create .env.production (but keep secrets out!)
echo "VITE_SUPABASE_URL=your_value" >> .env.production
```

---

## 🔧 **Configuration Template**

Salin & paste ke Vercel Environment Variables:

```env
# ============================================
# FRONTEND VARIABLES (VITE_*)
# ============================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_ARC_CHAIN_ID=5042002
VITE_ARC_CURRENCY_SYMBOL=USDC
VITE_ARC_EXPLORER_URL=https://testnet.arcscan.app
VITE_ADMIN_EMAIL=admin@admin.com
GEMINI_API_KEY=your_gemini_api_key_here

# ============================================
# BACKEND VARIABLES (SERVER-SIDE)
# ============================================
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
CIRCLE_WEBHOOK_PUBLIC_KEY=your_webhook_key
CIRCLE_BLOCKCHAIN=ARC-TESTNET
KIT_KEY=your_kit_key
PRIVATE_KEY=your_private_key
ADMIN_EMAIL=admin@admin.com
ADMIN_SECRET=your_admin_secret_token

# ============================================
# ARC CONFIGURATION
# ============================================
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_MASTER_MNEMONIC=your twelve word mnemonic phrase
ARC_HOT_WALLET_ADDRESS=0xYourCentralHotWalletAddress
ARC_USDC_CONTRACT=0x3600000000000000000000000000000000000000
PLATFORM_TREASURY_ADDRESS=0xYourTreasuryAddress
```

---

## 🧪 **Testing After Setup**

### **Test 1: Frontend Build Variables**
```bash
npm run build
# Check output for "Your account wallet could not be loaded"
# If you see placeholder values → VITE_ variables missing
```

### **Test 2: Backend Server Variables**
```bash
# Check health endpoint
curl https://arc-on-y1t4.vercel.app/api/health
# Expected: {"status":"ok","circle_keys":{"api_key":true,"entity_secret":true}}
```

### **Test 3: Login Flow**
1. Open https://arc-on-y1t4.vercel.app
2. Register new account
3. Check browser console for errors
4. Check Vercel Logs → Function Logs for missing variables

### **Test 4: Vercel Logs**
```bash
vercel logs arc-on-y1t4
# Filter: "VITE_SUPABASE_URL" atau "Missing"
```

---

## 🐛 **Debugging Checklist**

- [ ] Semua `VITE_*` variables set di Vercel (Frontend)
- [ ] Semua server variables set di Vercel (Backend)
- [ ] Environment dipilih: **Production**
- [ ] Redeploy setelah menambah variables (`git push` atau manual redeploy)
- [ ] Clear browser cache (Ctrl+Shift+Del)
- [ ] Check Vercel deployment logs untuk error
- [ ] Health endpoint menunjukkan `circle_keys: {api_key: true}`
- [ ] Browser console tidak menunjukkan placeholder warnings

---

## 📝 **Common Issues & Solutions**

### ❌ Issue: "Your account wallet could not be loaded. Missing Server Environment Variables"
```
✅ Solution: 
1. VITE_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ter-set
2. Vercel belum di-redeploy setelah menambah variables
3. Tunggu ~1 menit setelah redeploy untuk effect
```

### ❌ Issue: "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
```
✅ Solution:
1. Check api/config/supabase.ts line 10 & 23
2. Pastikan VITE_SUPABASE_URL ter-set di Vercel (untuk backend usage)
3. SUPABASE_SERVICE_ROLE_KEY harus ada (backend-only variable)
```

### ❌ Issue: Circle API errors saat wallet creation
```
✅ Solution:
1. CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET harus valid & tidak expired
2. CIRCLE_BLOCKCHAIN = "ARC-TESTNET" (case-sensitive)
3. Verify Circle credentials di Circle Console
```

---

## 🔗 **Related Files**
- Frontend Config: `src/lib/supabaseClient.ts`
- Backend Config: `api/config/supabase.ts`
- Vite Config: `vite.config.ts`
- Environment Template: `.env.example`
- Build Script: `package.json` (line 8)

---

## ✨ **Next Steps**
1. ✅ Set all variables di Vercel Dashboard
2. ✅ Redeploy project
3. ✅ Run verification tests
4. ✅ Test login flow
5. ✅ Monitor Vercel logs

