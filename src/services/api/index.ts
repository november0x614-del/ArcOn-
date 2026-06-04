import { useStore } from "../../store/useStore";
import { ARC_TESTNET } from "../../lib/arcConfig";
import { supabase } from "../../lib/supabaseClient";

/**
 * Helper for making API requests with error handling.
 */
export async function apiRequest(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: any,
  errorMessage: string = "Request failed",
) {
  // Retrieve the dynamic Supabase JWT access token for security verification
  const sessionResult = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  const token = sessionResult?.data?.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: any = {
    method,
    headers,
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
   * Unstaking functionality.
   */
  async unstakeTokens(amount: number, rewardAmount: number) {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    console.log(`[Adapter] [Unstake] Initiating unstake: ${amount} USDC principal with ${rewardAmount} USDC reward`);

    return apiRequest(
      "/api/stake/withdraw",
      "POST",
      {
        userId: registeredUser.supabaseUid,
        amount,
        rewardAmount,
      },
      "Unstaking failed",
    );
  },

  /**
   * Fetches current balances for the registered user.
   */
  async getBalance() {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    const data = await apiRequest(
      `/api/balance/${registeredUser.supabaseUid}`,
      "GET",
      undefined,
      "Failed to fetch balance",
    );

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
   */
  async getTokens() {
    return apiRequest(
      `/api/tokens`,
      "GET",
      undefined,
      "Failed to fetch tokens",
    );
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

    try {
      const data = await apiRequest(
        `/api/tokens/resolve/${cleanAddr}`,
        "GET",
        undefined,
        "Failed to resolve token",
      );
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

  async getImportedTokens() {
    return apiRequest(
      `/api/tokens/imported`,
      "GET",
      undefined,
      "Failed to fetch imported tokens",
    );
  },

  async removeImportedToken(address: string) {
    return apiRequest(
      `/api/tokens/imported/${address}`,
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

  async mintNFT(productId: string | number, merchantAddress: string, metadataUri: string) {
    return apiRequest("/api/ecommerce/mint-nft", "POST", {
      productId,
      merchantAddress,
      metadataUri
    });
  },

  async deleteProduct(productId: string | number) {
    return apiRequest(`/api/ecommerce/products/${productId}`, "DELETE");
  },

  /**
   * Resolves a wallet address to a username/name.
   */
  async resolveAddress(address: string) {
    const cleanAddr = address.toLowerCase().trim();
    if (!cleanAddr || cleanAddr.length !== 42) return null;

    try {
      const response = await fetch(`/api/wallets/resolve/${cleanAddr}`);
      if (response.ok) {
        const data = await response.json();
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

  /**
   * Inbox Notifications
   */
  async getInboxMessages() {
    return apiRequest(`/api/inbox`, "GET", undefined, "Failed to fetch inbox messages");
  },

  async markMessageAsRead(messageId: string) {
    return apiRequest("/api/inbox/read", "POST", { messageId });
  },
};
