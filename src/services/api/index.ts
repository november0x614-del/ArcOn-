import { useStore } from "../../store/useStore";
import { ARC_TESTNET } from "../../lib/arcConfig";

/**
 * Helper for making API requests with error handling.
 */
async function apiRequest(
  endpoint: string,
  method: "GET" | "POST",
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
  async swapTokens(
    amount: number,
    fromToken: string,
    toToken: string,
    tokenAddress: string,
  ) {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    console.log(
      `[Adapter] Initiating swap: ${amount} ${fromToken} -> ${toToken}`,
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
   * Bridges tokens between networks (General intent).
   */
  async bridgeToken(amount: number, fromNetwork: string, toNetwork: string) {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    console.log(
      `[Adapter] Initiating bridge: ${amount} from ${fromNetwork} to ${toNetwork}`,
    );

    return apiRequest(
      "/api/bridge/execute",
      "POST",
      {
        userId: registeredUser.supabaseUid,
        amount,
        fromNetwork,
        toNetwork,
      },
      "Bridge failed",
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
   * Fetches current balances for the registered user.
   */
  async getBalance() {
    const { registeredUser } = useStore.getState();
    if (!registeredUser?.supabaseUid) throw new Error("User not registered");

    return apiRequest(
      `/api/balance/${registeredUser.supabaseUid}`,
      "GET",
      undefined,
      "Failed to fetch balance",
    );
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
   * Returns the network configuration.
   */
  getNetworkConfig() {
    return ARC_TESTNET;
  },
};
