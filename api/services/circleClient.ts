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
        throw new Error("CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are required for wallet operations.");
    }

    return initiateDeveloperControlledWalletsClient({
        apiKey,
        entitySecret,
    });
};

/**
 * Singleton-like factory for Circle App Kit Client.
 * Ensures consistent configuration across the backend services.
 */
export const getAppKitInstance = () => {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
        throw new Error("CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are required for App Kit operations.");
    }

    const adapter = createCircleWalletsAdapter({ apiKey, entitySecret });
    // @ts-ignore
    return new AppKit({ adapter, apiKey });
};
