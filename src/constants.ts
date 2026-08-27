import { type Address, address } from "@solana/kit";
import { config } from "dotenv";

config();

function validateEnv(envKey: string): string {
  const value = process.env[envKey];

  if (!value) {
    throw new Error(`Unable to get var ${envKey}`);
  }
  return value;
}

export const PORT_APP = process.env.PORT;
export const CORS = process.env.CORS;

export const REDIS_PORT = Number(validateEnv("REDIS_PORT"));
export const REDIS_HOST = validateEnv("REDIS_HOST");
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_DB = Number(process.env.REDIS_DB);

const RAW_ADDRESSES = validateEnv("ALLOWED_PROGRAMS");

export const ALLOWED_PROGRAMS: Set<Address> = new Set(
  RAW_ADDRESSES.split(", ").map((key: string) => address(key)),
);

export const RELAYER_KEYPAIR = Uint8Array.from(
  JSON.parse(validateEnv("RELAYER_KEYPAIR")),
);
