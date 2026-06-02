import { useStore } from "../../store/useStore";
import { ARC_TESTNET } from "../../lib/arcConfig";

/**
 * Helper for making API requests with error handling.
 */
async function apiRequest(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: any,
  errorMessage: string = "Request failed",
) {
  const config: any = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) config.body = JSON.stringify(body);

  const response = await fetch(endpoint, config);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || errorMessage);
  }
  return response.json();
}

/**
 * BackendClient
 * Abstraction layer for interacting with the backend and Arc Network.
 * Handles intents like bridge, swap, and unified balance transfers.
 */
export const BackendClient = {
  /**
   * Executes a token swap on Arc Testnet.
   */
  /**
   * Fetch user preferences (e.g. transfer list favorites, hidden contacts)
   */
  async getPreferences() {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");
    return apiRequest(`/api/preferences/${registeredUser.supabaseUid}`, "GET");
  },

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: any) {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");
    return apiRequest(
      `/api/preferences/${registeredUser.supabaseUid}`,
      "PUT",
      { preferences },
      "Failed to update preferences",
    );
  },

  async swapTokens(
    amount: number,
    fromToken: any,
    toToken: any,
    tokenAddress: string,
  ) {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    console.log(
      `[Adapter] Initiating swap: ${amount} ${fromToken?.symbol} -> ${toToken?.symbol}`,
    );

    return apiRequest(
      "/api/swap/execute",
      "POST",
      {
        userId: registeredUser.supabaseUid,
        amount,
        fromToken,
        toToken,
        tokenAddress,
      },
      "Swap failed",
    );
  },

  /**
   * Sends funds using the Unified Balance intent.
   */
  async sendUnifiedBalance(
    amount: number,
    destinationAddress: string,
    memo?: string,
    recipientName?: string,
  ) {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    console.log(
      `[Adapter] Sending unified balance: ${amount} to ${destinationAddress}${memo ? ` with memo: ${memo}` : ""}`,
    );

    return apiRequest(
      "/api/transfer/execute",
      "POST",
      {
        userId: registeredUser.supabaseUid,
        amount,
        destinationAddress,
        memo,
        recipientName,
      },
      "Transfer failed",
    );
  },

  /**
   * Bridges tokens between networks using CCTP (Cross-Chain Transfer Protocol).
   */
  async bridgeTokenCCTP(
    amount: number,
    destinationAddress: string,
    destinationDomain: number,
  ) {
    if (amount <= 0) throw new Error("Invalid bridge amount");
    if (!destinationAddress || !destinationAddress.startsWith("0x") || destinationAddress.length !== 42) {
      throw new Error("Invalid destination address");
    }

    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    console.log(
      `[Adapter] [CCTP] Initiating bridge: ${amount} to domain ${destinationDomain}`,
    );

    return apiRequest(
      "/api/bridge/cctp",
      "POST",
      {
        userId: registeredUser.supabaseUid,
        amount,
        destinationAddress,
        destinationDomain,
      },
      "CCTP Bridge failed",
    );
  },

  /**
   * Bridges tokens between networks (Unified intent).
   */
  async bridgeToken(amount: number, destinationAddress: string, destinationDomain: number) {
    return BackendClient.bridgeTokenCCTP(amount, destinationAddress, destinationDomain);
  },

  /**
   * Fetches user transactions.
   */
  async getTransactions(userId: string) {
    return apiRequest(
      `/api/transactions/${userId}`,
      "GET",
      undefined,
      "Failed to fetch transactions",
    );
  },

  /**
   * Executes a withdrawal to a specified bank (Simulated/Off-ramp).
   */
  async executeWithdraw(amount: number, bank: string) {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    console.log(`[Adapter] Requesting withdrawal: ${amount} to ${bank}`);

    return apiRequest(
      "/api/withdraw/execute",
      "POST",
      {
        userId: registeredUser.supabaseUid,
        amount,
        bank,
      },
      "Withdraw failed",
    );
  },

  /**
   * Executes a purchase transaction.
   */
  async executePurchase(amount: number, product: string) {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    console.log(`[Adapter] Executing purchase: ${amount} for ${product}`);

    return apiRequest(
      "/api/purchase/execute",
      "POST",
      {
        userId: registeredUser.supabaseUid,
        amount,
        product,
      },
      "Purchase failed",
    );
  },

  /**
   * Staking functionality.
   */
  async stakeTokens(amount: number) {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    console.log(`[Adapter] [Stake] Initiating staking: ${amount} USDC`);

    return apiRequest(
      "/api/stake/execute",
      "POST",
      {
        userId: registeredUser.supabaseUid,
        amount,
      },
      "Staking failed",
    );
  },

  /**
   * Helper to handle localStorage caching with TTL (Disabled for Server-First)
   */
  getCachedData(key: string, ttlMs: number) {
    return null;
  },

  setCachedData(key: string, data: any) {
    // Disabled
  },

  /**
   * Fetches current balances for the registered user.
   * Cached for 30 seconds to prevent rapid redundant calls.
   */
  async getBalance() {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    const CACHE_KEY = `arc_balance_${registeredUser.supabaseUid}`;
    const cached = BackendClient.getCachedData(CACHE_KEY, 30 * 1000); // 30s
    if (cached) return cached;

    const data = await apiRequest(
      `/api/balance/${registeredUser.supabaseUid}`,
      "GET",
      undefined,
      "Failed to fetch balance",
    );

    if (data) BackendClient.setCachedData(CACHE_KEY, data);
    return data;
  },

  /**
   * Fetches live rates between tokens.
   */
  async getLiveRate(fromToken: string, toToken: string) {
    return apiRequest(
      `/api/rates?from=${fromToken}&to=${toToken}`,
      "GET",
      undefined,
      "Failed to fetch rate",
    );
  },

  /**
   * Fetches available tokens list.
   * Cached for 1 hour.
   */
  async getTokens() {
    const CACHE_KEY = "arc_tokens_list";
    const cached = BackendClient.getCachedData(CACHE_KEY, 60 * 60 * 1000); // 1h
    if (cached) return cached;

    const data = await apiRequest(
      `/api/tokens`,
      "GET",
      undefined,
      "Failed to fetch tokens",
    );

    if (data) BackendClient.setCachedData(CACHE_KEY, data);
    return data;
  },

  /**
   * Fetches specific token details using Circle ID.
   */
  async getTokenDetails(tokenId: string) {
    return apiRequest(
      `/api/tokens/${tokenId}`,
      "GET",
      undefined,
      "Failed to fetch token details",
    );
  },

  /**
   * Resolves a token contract address to its metadata.
   */
  async resolveToken(address: string) {
    const cleanAddr = address.toLowerCase().trim();
    if (!cleanAddr || !cleanAddr.startsWith("0x")) return null;

    const CACHE_KEY = `arc_token_metadata_${cleanAddr}`;
    const cached = BackendClient.getCachedData(
      CACHE_KEY,
      7 * 24 * 60 * 60 * 1000,
    ); // 7 days
    if (cached) return cached;

    try {
      const data = await apiRequest(
        `/api/tokens/resolve/${cleanAddr}`,
        "GET",
        undefined,
        "Failed to resolve token",
      );
      if (data) {
        BackendClient.setCachedData(CACHE_KEY, data);
      }
      return data;
    } catch (err) {
      console.error("[Token Resolver Error] API call failed:", err);
      return null;
    }
  },

  async saveImportedToken(userId: string, token: any) {
    return apiRequest(
      `/api/tokens/import`,
      "POST",
      {
        userId,
        ...token,
      },
      "Failed to save token to database",
    );
  },

  async getImportedTokens(userId: string) {
    return apiRequest(
      `/api/tokens/imported/${userId}`,
      "GET",
      undefined,
      "Failed to fetch imported tokens",
    );
  },

  async removeImportedToken(userId: string, address: string) {
    return apiRequest(
      `/api/tokens/imported/${userId}/${address}`,
      "DELETE",
      undefined,
      "Failed to delete token",
    );
  },

  /**
   * E-commerce Products
   */
  async getProducts() {
    return apiRequest("/api/ecommerce/products", "GET");
  },

  async saveProduct(product: any) {
    return apiRequest("/api/ecommerce/products", "POST", product);
  },

  async updateProduct(productId: string | number, updates: any) {
    return apiRequest(`/api/ecommerce/products/${productId}`, "PUT", updates);
  },

  async fetchNFTs(userId: string) {
    return apiRequest(`/api/nfts/${userId}`, "GET");
  },

  async deleteProduct(productId: string | number) {
    return apiRequest(`/api/ecommerce/products/${productId}`, "DELETE");
  },

  /**
   * Resolves a wallet address to a username/name with caching.
   * Cached for 24 hours.
   */
  async resolveAddress(address: string) {
    const cleanAddr = address.toLowerCase().trim();
    if (!cleanAddr || cleanAddr.length !== 42) return null;

    const CACHE_KEY = `arc_resolve_${cleanAddr}`;
    const cached = BackendClient.getCachedData(CACHE_KEY, 24 * 60 * 60 * 1000); // 24h
    if (cached) {
      console.log(`[Cache Hit] Resolved ${cleanAddr} -> ${cached.name}`);
      return cached;
    }

    try {
      const response = await fetch(`/api/wallets/resolve/${cleanAddr}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.name) {
          BackendClient.setCachedData(CACHE_KEY, data);
        }
        return data;
      }
      return null;
    } catch (err) {
      console.error("[Resolver Error] API call failed:", err);
      return null;
    }
  },

  /**
   * Platform Configuration
   */
  async getPlatformConfigs() {
    return apiRequest("/api/admin/config", "GET");
  },

  async savePlatformConfig(config: any) {
    return apiRequest("/api/admin/config", "POST", config);
  },

  /**
   * Audit Logs
   */
  async getAuditLogs() {
    return apiRequest("/api/admin/transactions", "GET");
  },

  async getAdminStats() {
    return apiRequest("/api/admin/stats", "GET");
  },
};
