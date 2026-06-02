import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

const kit = new AppKit();

/**
 * Gets the delegate adapter from the provided private key
 */
export const getDelegateAdapter = (privateKey: string) => {
  if (!privateKey) {
    throw new Error("Private key is required");
  }
  return createViemAdapterFromPrivateKey({
    privateKey: privateKey as `0x${string}`,
  });
};

export const unifiedBalanceKit = kit.unifiedBalance;
