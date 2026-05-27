import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { AppKit } from "@circle-fin/app-kit";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";

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

let _appKit: AppKit | null = null;
let _adapter: any = null;

export const getAppKitInstance = () => {
  if (!_appKit || !_adapter) {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
      throw new Error(
        "CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are required for AppKit.",
      );
    }

    _adapter = createCircleWalletsAdapter({
      apiKey,
      entitySecret,
    });

    _appKit = new AppKit();
  }
  return { kit: _appKit, adapter: _adapter };
};
