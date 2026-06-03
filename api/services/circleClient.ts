import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

/**
 * Singleton-like factory for Circle Developer-Controlled Wallets Client.
 * Ensures consistent configuration across the backend services.
 */
export const getCircleClientInstance = () => {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    throw new Error(
      "CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are required for wallet operations.",
    );
  }

  return initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });
};

/**
 * Basic fetch wrapper for Circle REST API endpoints not covered by the SDK.
 */
export const circleApiFetch = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey) throw new Error("CIRCLE_API_KEY is required");

  const url = `https://api.circle.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Circle API error (${response.status}): ${errorText}`);
  }

  return response.json();
};

export const resolveWalletSetId = async (): Promise<string> => {
  if (process.env.CIRCLE_WALLET_SET_ID) {
    return process.env.CIRCLE_WALLET_SET_ID;
  }

  try {
    const response = await circleApiFetch('/v1/w3s/walletSets');
    const sets = response.data?.walletSets;
    if (sets && sets.length > 0) {
      console.warn("[CircleClient] Returning existing WalletSet ID from API instead of env var.");
      return sets[0].id;
    }
    
    // Create one if absolutely empty
    console.warn("[CircleClient] Creating initial WalletSet automatically.");
    const client = getCircleClientInstance();
    const createRes = await client.createWalletSet({ name: "Lounge Auto Wallet Set" });
    if (createRes.data?.walletSet?.id) {
       return createRes.data.walletSet.id;
    }
  } catch (err) {
    console.error("[CircleClient] Failed to resolve wallet sets:", err);
  }
  
  throw new Error("Missing CIRCLE_WALLET_SET_ID and failed to retrieve/create one from Circle API.");
};
