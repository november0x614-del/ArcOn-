import { AppKit } from "@circle-fin/app-kit";
import CircleWalletsAdapter from "@circle-fin/adapter-circle-wallets";

/**
 * arcAppKit Helper
 * Provides a unified abstraction for Arc Network operations 
 * using Circle's App Kit SDK.
 */

let kitInstance: AppKit | null = null;

export function getArcAppKit() {
    if (!kitInstance) {
        kitInstance = new AppKit();
    }
    return kitInstance;
}

export function getCircleAdapter(walletId: string, entitySecret: string) {
    return new (CircleWalletsAdapter as any)({
        apiKey: process.env.CIRCLE_API_KEY || "",
        entitySecret: entitySecret || process.env.CIRCLE_ENTITY_SECRET || "",
        walletId: walletId,
    });
}
