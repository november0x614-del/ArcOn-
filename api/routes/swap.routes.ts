import express from "express";
import { kit } from "@circle-fin/swap-kit";
import { viemAdapter } from "@circle-fin/adapter-viem-v2";

const router = express.Router();

router.post("/execute", async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn } = req.body;

    if (!process.env.KIT_KEY) {
      return res.status(500).json({ error: "KIT_KEY is not configured" });
    }

    const result = await kit.swap({
      from: { adapter: viemAdapter, chain: "Arc_Testnet" },
      tokenIn,
      tokenOut,
      amountIn,
      config: {
        kitKey: process.env.KIT_KEY,
      },
    });

    res.json(result);
  } catch (error: any) {
    console.error("Swap error:", error);
    res.status(500).json({ error: error.message || "Swap failed" });
  }
});

export default router;
