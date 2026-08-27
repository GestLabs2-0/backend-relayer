// Setup test environment variables before modules load
process.env.PORT = "3030";
process.env.CORS = "http://localhost:3000,http://localhost:5173";
process.env.REDIS_PORT = "6379";
process.env.REDIS_HOST = "127.0.0.1";
process.env.REDIS_PASSWORD = "";
process.env.REDIS_DB = "0";
process.env.ALLOWED_PROGRAMS =
  "11111111111111111111111111111111, TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
process.env.RELAYER_KEYPAIR = JSON.stringify(
  Array.from(new Uint8Array(32).fill(2)),
);
