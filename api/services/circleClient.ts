import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

/**
 * Get the circle base URL based on the environment (Sandbox vs Production).
 */
export const getCircleBaseUrl = (): string => {
  const apiKey = process.env.CIRCLE_API_KEY || "";
  const blockchain = process.env.CIRCLE_BLOCKCHAIN || "";
  
  if (
    apiKey.toLowerCase().includes("sandbox") ||
    apiKey.toLowerCase().includes("test") ||
    blockchain.toUpperCase().includes("TESTNET")
  ) {
    return "https://api-sandbox.circle.com";
  }
  return "https://api.circle.com";
};

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

  const baseUrl = getCircleBaseUrl();

  return initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
    baseUrl,
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

  const baseUrl = getCircleBaseUrl();
  const url = `${baseUrl}${endpoint}`;
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
