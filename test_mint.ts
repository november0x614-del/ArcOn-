import fetch from "node-fetch";

async function run() {
  console.log("Minting NFT");
  const response = await fetch("http://127.0.0.1:3000/api/nft/mint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "11111111-1111-1111-1111-111111111111",
      walletAddress: "0x123",
      name: "Test",
      description: "Test",
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" 
    })
  });
  
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);
}

run();
