import { config } from "dotenv";
config();
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

async function run() {
  const client = initiateDeveloperControlledWalletsClient({ apiKey: process.env.CIRCLE_API_KEY!, entitySecret: process.env.CIRCLE_ENTITY_SECRET! });
  try {
    const res = await client.getTransactions({ limit: 5 });
    console.log(res.data?.transactions?.map((t: any) => ({ id: t.id, txType: t.transactionType, status: t.state })));
  } catch (e: any) {
    console.error(e.message);
  }
}
run();
