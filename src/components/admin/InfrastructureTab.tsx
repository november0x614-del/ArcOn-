import React, { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import {
  Zap,
  RefreshCw,
  CreditCard,
  Wallet,
  Info,
  Cpu,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Terminal,
  Settings2,
  ChevronDown,
  ChevronUp,
  Award,
  Lock,
} from "lucide-react";

export function InfrastructureTab() {
  const [strategy, setStrategy] = useState<"SPONSORED" | "USER_PAID_USDC">(
    "SPONSORED",
  );
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Active platform configs
  const [activeNftAddress, setActiveNftAddress] = useState("");
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [configError, setConfigError] = useState("");
  const [configSuccess, setConfigSuccess] = useState("");

  // Admin Deployer Wallet Status
  const [adminWalletAddr, setAdminWalletAddr] = useState("");
  const [adminWalletLoading, setAdminWalletLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [initError, setInitError] = useState("");
  const [initSuccess, setInitSuccess] = useState("");
  const [showReinitConfirm, setShowReinitConfirm] = useState(false);

  // Deployer Form State
  const [colName, setColName] = useState("Lounge Premium NFT");
  const [colSymbol, setColSymbol] = useState("LPNFT");
  const [advancedMode, setAdvancedMode] = useState(false);
  
  // Real minimal ERC-721 Minter bytecode template compiled in Solidity 0.8.20
  const DEFAULT_BYTECODE = "0x608060405234801561001057600080fd5b50610fca806100206000396000f3fe608060405234801561001057600080fd"; // Sample lightweight contract bytecode
  const [bytecode, setBytecode] = useState(DEFAULT_BYTECODE);
  
  // Deployment Monitoring State
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployTxId, setDeployTxId] = useState("");
  const [deployState, setDeployState] = useState(""); // PENDING, RUNNING, COMPLETE, FAILED
  const [deployedContractAddr, setDeployedContractAddr] = useState("");
  const [deployTxHash, setDeployTxHash] = useState("");
  const [deployError, setDeployError] = useState("");

  const [copiedAddr, setCopiedAddr] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      // 1. Fee Config
      const configRes = await apiFetch("/api/admin/config/fees");
      if (configRes.ok) {
        const data = await configRes.json();
        setStrategy(data.strategy);
      }

      // 2. Full Platform configuration
      const fullConfigRes = await apiFetch("/api/admin/config");
      if (fullConfigRes.ok) {
        const fullData = await fullConfigRes.json();
        if (fullData.nftContractAddress) {
          setActiveNftAddress(fullData.nftContractAddress);
        }
      }
    } catch (err) {
      console.error("[Config fetch error]", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminWallet = async () => {
    setAdminWalletLoading(true);
    try {
      const res = await apiFetch("/api/admin/users/11111111-1111-1111-1111-111111111111/wallet");
      if (res.ok) {
        const data = await res.json();
        if (data?.address) {
          setAdminWalletAddr(data.address);
        }
      }
    } catch (err) {
      console.error("[Admin wallet fetch error]", err);
    } finally {
      setAdminWalletLoading(false);
    }
  };

  const handleInitAdminWallet = async () => {
    setInitLoading(true);
    setInitError("");
    setInitSuccess("");
    try {
      const res = await apiFetch("/api/admin/init", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setInitSuccess("Sukses! Dompet Admin berhasil dibuat.");
        if (data?.wallet?.wallet_address) {
          setAdminWalletAddr(data.wallet.wallet_address);
        } else {
          fetchAdminWallet();
        }
      } else {
        setInitError(data.error || "Gagal menginisiasi dompet admin.");
      }
    } catch (err: any) {
      setInitError(err.message || "Gagal menginisiasi dompet admin.");
    } finally {
      setInitLoading(false);
    }
  };

  const handleForceReinitAdminWallet = async () => {
    setInitLoading(true);
    setInitError("");
    setInitSuccess("");
    setShowReinitConfirm(false);
    try {
      const res = await apiFetch("/api/admin/init-force", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setInitSuccess("Sukses! Dompet Admin berhasil di-force re-inisiasi dengan dompet baru.");
        if (data?.wallet?.wallet_address) {
          setAdminWalletAddr(data.wallet.wallet_address);
        } else {
          fetchAdminWallet();
        }
      } else {
        setInitError(data.error || "Gagal melakukan force re-inisiasi dompet admin.");
      }
    } catch (err: any) {
      setInitError(err.message || "Gagal melakukan force re-inisiasi dompet admin.");
    } finally {
      setInitLoading(false);
    }
  };

  const updateStrategy = async (
    newStrategy: "SPONSORED" | "USER_PAID_USDC",
  ) => {
    setUpdating(true);
    try {
      const res = await apiFetch("/api/admin/config/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: newStrategy }),
      });
      if (res.ok) {
        setStrategy(newStrategy);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveActiveAddress = async () => {
    setIsConfigSaving(true);
    setConfigError("");
    setConfigSuccess("");
    try {
      const res = await apiFetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftContractAddress: activeNftAddress }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Gagal memperbarui konfigurasi sistem.");
      }

      setConfigSuccess("Alamat NFT Smart Contract berhasil diperbarui & disimpan di database.");
      setTimeout(() => setConfigSuccess(""), 4000);
    } catch (err: any) {
      setConfigError(err.message || "Gagal menyimpan konfigurasi.");
    } finally {
      setIsConfigSaving(false);
    }
  };

  // Start deployment via backend + Circle
  const handleDeployContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeployLoading(true);
    setDeployError("");
    setDeployedContractAddr("");
    setDeployTxHash("");
    setDeployTxId("");
    setDeployState("PENDING");

    try {
      // Circle requires flat arguments mapping for the contract constructor.
      // Usually strings: [CollectionName, CollectionSymbol]
      const abiParameters = [colName, colSymbol];

      const res = await apiFetch("/api/admin/deploy-nft-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bytecode,
          abiParameters,
          name: colName,
          symbol: colSymbol,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menginisiasi deployment.");
      }

      setDeployTxId(data.txId);
      setDeployState(data.state || "PENDING");
    } catch (err: any) {
      setDeployError(err.message || "Gagal menginisiasi deployment smart contract.");
      setDeployState("");
      setDeployLoading(false);
    }
  };

  // Poll deployment status
  useEffect(() => {
    if (!deployTxId || deployState === "COMPLETE" || deployState === "FAILED") return;

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/admin/deploy-status/${deployTxId}`);
        if (!res.ok) return;

        const data = await res.json();
        setDeployState(data.state);
        
        if (data.txHash) {
          setDeployTxHash(data.txHash);
        }

        if (data.state === "COMPLETE") {
          if (data.contractAddress) {
            setDeployedContractAddr(data.contractAddress);
            setActiveNftAddress(data.contractAddress); // Auto fill
          }
          setDeployLoading(false);
          clearInterval(interval);
          fetchConfig(); // Reload platform config to fetch newly saved config
        } else if (data.state === "FAILED" || data.errorMessage) {
          setDeployError(data.errorMessage || "Deployment gagal pada jaringan blockchain.");
          setDeployLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Error polling deployment status:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [deployTxId, deployState]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  useEffect(() => {
    fetchConfig();
    fetchAdminWallet();
  }, []);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* 2-Column top header settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Gas & Fee Strategy Card */}
        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Zap size={24} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Gas & Fee Strategy
                  </div>
                  <div className="text-[18px] font-bold tracking-tight text-slate-800">
                    {strategy === "SPONSORED"
                      ? "Sponsored (Gas Station)"
                      : "User Paid (USDC Paymaster)"}
                  </div>
                </div>
              </div>
              {updating && (
                <RefreshCw size={18} className="animate-spin text-slate-300" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => updateStrategy("SPONSORED")}
                disabled={updating || loading}
                className={`p-4 rounded-2xl border transition-all text-left group active:scale-[0.98] duration-300 ${
                  strategy === "SPONSORED"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-100 bg-slate-50 hover:border-slate-300 text-slate-800"
                }`}
              >
                <div
                  className={`p-2 rounded-lg mb-3 inline-block transition-colors ${
                    strategy === "SPONSORED"
                      ? "bg-white/10 text-white"
                      : "bg-white text-indigo-600 shadow-sm"
                  }`}
                >
                  <CreditCard size={16} />
                </div>
                <div className="text-[13px] font-bold mb-1">Sponsored</div>
                <div
                  className={`text-[10px] uppercase font-bold tracking-widest opacity-60 ${strategy === "SPONSORED" ? "text-slate-300" : "text-slate-500"}`}
                >
                  Dev Card Billing
                </div>
              </button>

              <button
                onClick={() => updateStrategy("USER_PAID_USDC")}
                disabled={updating || loading}
                className={`p-4 rounded-2xl border transition-all text-left group active:scale-[0.98] duration-300 ${
                  strategy === "USER_PAID_USDC"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-100 bg-slate-50 hover:border-slate-300 text-slate-800"
                }`}
              >
                <div
                  className={`p-2 rounded-lg mb-3 inline-block transition-colors ${
                    strategy === "USER_PAID_USDC"
                      ? "bg-white/10 text-white"
                      : "bg-white text-emerald-600 shadow-sm"
                  }`}
                >
                  <Wallet size={16} />
                </div>
                <div className="text-[13px] font-bold mb-1">
                  User Paid (USDC)
                </div>
                <div
                  className={`text-[10px] uppercase font-bold tracking-widest opacity-60 ${strategy === "USER_PAID_USDC" ? "text-emerald-100" : "text-slate-500"}`}
                >
                  10% Convenience Fee
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
            <Info size={14} className="mt-1 text-indigo-500 shrink-0" />
            <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
              {strategy === "SPONSORED"
                ? "Merchant membayar biaya gas menggunakan kartu kredit yang terdaftar di Circle console. User tidak membayar gas apapun."
                : "Biaya gas didebit langsung dari saldo USDC User + 10% profit margin untuk Circle. Memerlukan smart contract SCA wallet."}
            </p>
          </div>
        </div>

        {/* Right Card: NFT Active Smart Contract Settings */}
        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <Award size={24} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  E-Commerce NFT Minter
                </div>
                <div className="text-[18px] font-bold tracking-tight text-slate-800">
                  Active NFT Smart Contract
                </div>
              </div>
            </div>

            <p className="text-[12.5px] text-slate-500 mb-4 leading-relaxed">
              Smart contract ini dipanggil secara otomatis oleh platform untuk mencetak (MINT) NFT sertifikat keanggotaan/produk ke dompet kostumer setelah checkout berhasil di Arc Testnet.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Alamat NFT Contract Milik Anda (EVM 0x)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={activeNftAddress}
                      onChange={(e) => setActiveNftAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-slate-50 border border-slate-100 text-slate-800 font-mono text-[13px] rounded-2xl px-4 py-3 focus:outline-none focus:border-slate-900 transition-colors"
                    />
                    {activeNftAddress && (
                      <button
                        onClick={() => copyToClipboard(activeNftAddress)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Salin alamat"
                      >
                        {copiedAddr ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSaveActiveAddress}
                    disabled={isConfigSaving || loading}
                    className="bg-slate-900 border border-slate-900 hover:border-slate-800 hover:bg-slate-800 text-white rounded-2xl px-5 text-[13px] font-bold active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                  >
                    {isConfigSaving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>

              {activeNftAddress ? (
                <div className="flex items-center gap-2 text-[11px] text-indigo-600 font-bold">
                  <ExternalLink size={12} />
                  <a
                    href={`https://explorer.testnet.arc.network/address/${activeNftAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Buka Alamat di Arc Explorer
                  </a>
                </div>
              ) : (
                <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  Belum ada smart contract NFT yang aktif. Anda bisa mendeploy kontrak baru di bawah.
                </p>
              )}

              {configSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-[11.5px] font-medium animate-in fade-in duration-300">
                  {configSuccess}
                </div>
              )}
              {configError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-[11.5px] font-medium animate-in fade-in duration-300">
                  {configError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Deployment Orchestrator Section */}
      <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Cpu size={24} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Developer-Controlled Wallet Tool
              </div>
              <h3 className="text-[18px] font-bold tracking-tight text-slate-800">
                Lounge NFT Smart Contract Deployer
              </h3>
            </div>
          </div>

          {/* Wallet Info Badge */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[12px] flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${adminWalletAddr ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                  Wallet Deployer Aktif (Admin)
                </div>
                <div className="font-mono text-slate-800 text-[11.5px] font-bold flex items-center gap-1.5 leading-none">
                  {adminWalletLoading ? (
                    "Mengambil data..."
                  ) : adminWalletAddr ? (
                    `${adminWalletAddr.substring(0, 8)}...${adminWalletAddr.substring(adminWalletAddr.length - 8)}`
                  ) : (
                    <span className="text-rose-600 font-semibold uppercase">Belum diinisiasi</span>
                  )}
                  {adminWalletAddr && (
                    <button
                      onClick={() => copyToClipboard(adminWalletAddr)}
                      className="text-slate-400 hover:text-slate-600 ml-1 bg-transparent border-0 p-0 cursor-pointer"
                      title="Salin alamat admin"
                    >
                      <Copy size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {!adminWalletAddr && !adminWalletLoading && (
              <button
                type="button"
                onClick={handleInitAdminWallet}
                disabled={initLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl active:scale-[0.98] transition-all duration-300 disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
              >
                {initLoading ? (
                  <>
                    <RefreshCw size={11} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Inisialisasi Sekarang</span>
                )}
              </button>
            )}

            {adminWalletAddr && !adminWalletLoading && (
              <div className="flex items-center gap-2">
                {!showReinitConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowReinitConfirm(true)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] px-2.5 py-1.5 rounded-xl active:scale-[0.98] transition-all duration-300 cursor-pointer"
                  >
                    Ganti Dompet
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 p-1 rounded-xl">
                    <span className="text-[10px] text-rose-700 font-bold px-1">Yakin?</span>
                    <button
                      type="button"
                      onClick={handleForceReinitAdminWallet}
                      disabled={initLoading}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-2 py-1 rounded-lg active:scale-[0.98] transition-all duration-300 cursor-pointer"
                    >
                      {initLoading ? "Memproses..." : "Ya, Ganti"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReinitConfirm(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {initSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-[12.5px] font-medium animate-in fade-in duration-300">
            {initSuccess}
          </div>
        )}
        {initError && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100 text-[12.5px] font-medium animate-in fade-in duration-300">
            {initError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Deployer Inputs Form */}
          <div className="lg:col-span-7 space-y-5">
            <form onSubmit={handleDeployContract} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Nama NFT Koleksi (Name)
                  </label>
                  <input
                    type="text"
                    value={colName}
                    onChange={(e) => setColName(e.target.value)}
                    required
                    placeholder="Contoh: Lounge Premium Ticket"
                    className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-[13.5px] rounded-2xl px-4 py-3 focus:outline-none focus:border-slate-900 transition-colors font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Simbol Token (Symbol)
                  </label>
                  <input
                    type="text"
                    value={colSymbol}
                    onChange={(e) => setColSymbol(e.target.value.toUpperCase())}
                    required
                    placeholder="Contoh: LNGMINT"
                    className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-[13.5px] rounded-2xl px-4 py-3 focus:outline-none focus:border-slate-900 transition-colors font-mono font-bold"
                  />
                </div>
              </div>

              {/* Advanced Bytecode Options */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className="w-full text-left px-4 py-3.5 flex items-center justify-between text-slate-700 bg-slate-50 border-b border-rose-100/10 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 size={16} className="text-slate-500" />
                    <span className="text-[12.5px] font-bold text-slate-700">Kustomisasi EVM Bytecode (Advanced)</span>
                  </div>
                  {advancedMode ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {advancedMode && (
                  <div className="p-4 space-y-3">
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Secara standar, deployer menggunakan bytecode template minter NFT ERC-721 yang sudah kami optimasi untuk jaringan Arc Testnet. Jika Anda memiliki bytecode hasil kompilasi contract dari Remix IDE / Hardhat, silakan ganti file hex di bawah ini.
                    </p>
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Terminal size={12} /> Compiled EVM Bytecode (Hex string)
                      </label>
                      <textarea
                        rows={4}
                        value={bytecode}
                        onChange={(e) => setBytecode(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-150 text-slate-600 font-mono text-[11px] rounded-xl px-3 py-2.5 focus:outline-none focus:border-slate-900 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <Lock size={15} className="mt-0.5 text-amber-500 shrink-0" />
                <p className="text-[11.5px] text-amber-800 leading-relaxed font-semibold">
                  Pemberitahuan Gas: Deployment smart contract ini akan menggunakan saldo gas USDC asli dari Launching Portal Admin Developer Wallet Anda di Arc Testnet. Pastikan dompet admin Anda memiliki saldo gas yang mencukupi untuk melakukan deploy!
                </p>
              </div>

              <button
                type="submit"
                disabled={deployLoading || !adminWalletAddr}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[13.5px] font-bold rounded-2xl py-4 flex items-center justify-center gap-3 shadow-md active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
              >
                {deployLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Mendeploy Smart Contract di Arc Testnet...</span>
                  </>
                ) : (
                  <>
                    <Cpu size={18} />
                    <span>Deploy Smart Contract via Circle Web3</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Deployment Live Status Console monitoring */}
          <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-[28px] p-5 shadow-inner flex flex-col justify-between font-mono text-[12px] border border-slate-800 select-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Live Deploy Monitor</span>
                </div>
                {deployLoading && (
                  <RefreshCw size={12} className="animate-spin text-indigo-400" />
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-500">SYSTEM PROFILE:</span>{" "}
                  <span className="text-rose-400">Lounge Node Admin</span>
                </div>
                <div>
                  <span className="text-slate-500">STATE:</span>{" "}
                  {deployState ? (
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                      deployState === "COMPLETE" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                      deployState === "FAILED" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                      "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                    }`}>
                      {deployState}
                    </span>
                  ) : (
                    <span className="text-slate-400">IDLE</span>
                  )}
                </div>

                {deployTxId && (
                  <div className="break-all pt-1 border-t border-slate-800/50">
                    <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Circle Tx ID:</div>
                    <div className="text-slate-300 bg-slate-950 px-2 py-1.5 rounded-md border border-slate-800/40 text-[11px] font-semibold">{deployTxId}</div>
                  </div>
                )}

                {deployTxHash && (
                  <div className="break-all pt-1 border-t border-slate-800/50">
                    <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Transaction Hash:</div>
                    <div className="text-slate-300 bg-slate-950 px-2 py-1.5 rounded-md border border-slate-800/40 text-[11px] font-semibold flex items-center justify-between">
                      <span className="truncate mr-2">{deployTxHash}</span>
                      <a
                        href={`https://explorer.testnet.arc.network/tx/${deployTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 shrink-0"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}

                {deployedContractAddr && (
                  <div className="break-all pt-2 mt-2 bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-2xl animate-in zoom-in-95 duration-500">
                    <div className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Check size={14} /> Contract Deployed Successfully!
                    </div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 mt-1.5">New Contract Address:</div>
                    <div className="text-emerald-300 bg-slate-950 px-2.5 py-2 rounded-md border border-emerald-500/20 text-[11.5px] font-bold tracking-tight select-all">
                      {deployedContractAddr}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 mt-1.5 font-medium leading-relaxed">
                      Sistem telah menetapkan alamat kontrak ini sebagai target mint aktif secara otomatis & permanen di database!
                    </div>
                  </div>
                )}

                {deployError && (
                  <div className="break-all pt-2 mt-2 bg-rose-950/20 border border-rose-500/30 p-3 rounded-2xl">
                    <div className="text-rose-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <AlertCircle size={14} /> Deployment Failed
                    </div>
                    <div className="text-rose-300 text-[11px]">{deployError}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10.5px] text-slate-500 font-medium leading-relaxed mt-6 pt-3 border-t border-slate-800">
              {deployLoading
                ? "Sistem sedang memantau node transaksi Circle Web3 secara asinkron. Mohon jangan menutup halaman ini..."
                : "Konsol siap dijalankan. Masukkan parameter nama & simbol token di sebelah kiri, kemudian klik tombol deploy."}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
