async function run() {
  try {
    const res = await fetch('http://0.0.0.0:3000/api/transactions/123');
    console.log(res.status, await res.text());
  } catch (err) {
    console.error('API health check error:', err.message);
  }
}
run();
