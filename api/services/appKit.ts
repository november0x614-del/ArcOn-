import { AppKit } from "@circle-fin/app-kit";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";

let appKitInstance: AppKit | null = null;
let adapterInstance: any = null;

export const getAppKitContext = () => {
  if (!appKitInstance || !adapterInstance) {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
      throw new Error(
        "CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are required for AppKit.",
      );
    }

    adapterInstance = createCircleWalletsAdapter({
      apiKey,
      entitySecret,
    });

    appKitInstance = new AppKit();
  }

  return { kit: appKitInstance, adapter: adapterInstance };
};
