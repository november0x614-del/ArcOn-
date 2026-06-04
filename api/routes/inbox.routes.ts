import express from "express";
import { getSupabaseAdmin } from "../config/supabase.js";
import { requireUserAuth } from "../middleware/userAuth.js";

const router = express.Router();

// Enforce authentication on all inbox endpoints
router.use(requireUserAuth);

/**
 * Fetch all inbox messages for the authenticated user
 */
router.get("/inbox", async (req, res) => {
  try {
    const userId = (req as any).userId;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("inbox_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
       console.warn("[InboxRoute] Table inbox_messages might not exist yet:", error.message);
       if (error.code === '42P01') return res.json([]);
       throw error;
    }

    res.json(data || []);
  } catch (error: any) {
    console.error("[InboxRoute] Error fetching messages (Full Error):", JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: error.message || "Unknown error fetching messages",
      code: error.code,
      details: error.details
    });
  }
});

/**
 * Mark a message as read
 */
router.post("/inbox/read", async (req, res) => {
  try {
    const { messageId } = req.body;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("inbox_messages")
      .update({ is_read: true })
      .eq("id", messageId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
