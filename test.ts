import fetch from "node-fetch";

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/transactions/15cb1dce-4127-466a-bc1d-fe0ea4420eaf");
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
