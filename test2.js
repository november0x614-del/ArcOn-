import http from "http";
http.get("http://127.0.0.1:3000/api/balance/762066e7-4f57-4044-adc3-6c7f95eaef7b", (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Headers:", res.headers);
    console.log("Body starts with:", data.substring(0, 100));
  });
}).on("error", (err) => console.error(err));
