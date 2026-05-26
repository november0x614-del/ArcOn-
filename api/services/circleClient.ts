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
 * Factory for Arc App Kit Instance using Circle Wallets Adapter.
 */
export const getArcAppKit = (walletId: string) => {
    const apiKey = process.env.CIRCLE_API_KEY as string;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET as string;
    
    const adapter = createCircleWalletsAdapter({
        apiKey,
        entitySecret,
        walletId
    } as any);

    const kit = new AppKit();
    (kit as any).adapter = adapter; // Store it for easier access since constructor might differ
    return kit;
};
