import { config } from "dotenv";
config();
import { getAppKit } from "./api/services/appkit.js";

async function run() {
  try {
    console.log("Testing bridge...");
    const { appKit, adapter } = getAppKit();
    const result = await appKit.bridge({
      from: { adapter, chain: "Arc_Testnet", address: "0x1234123412341234123412341234123412341234" },
      to: { chain: "Ethereum_Sepolia", recipientAddress: "0x1234123412341234123412341234123412341234", useForwarder: true },
      amount: "1.0",
      token: "USDC",
      config: { kitKey: process.env.KIT_KEY }
    } as any);
    console.log(result);
  } catch (e: any) {
    console.error(e.message);
  }
}
run();
