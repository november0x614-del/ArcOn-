import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY!);

async function run() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  const userId = users?.users?.[0]?.id || '11111111-1111-1111-1111-111111111111';

  console.log("Checking out with buyerId:", userId);
  const response = await fetch("http://127.0.0.1:3000/api/ecommerce/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyerId: userId,
      productId: 1,
      amount: "1",
      memo: "Test product",
    })
  });
  
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);
}

run();
