import type { Address } from "@solana/kit";
import { Redis } from "ioredis";
import {
  REDIS_DB,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
} from "#constants.js";

export interface RateLimit {
  allowed({ ip, address }: { ip: string; address: Address }): Promise<boolean>;
}

export class RedisService implements RateLimit {
  private client: Redis;

  constructor(
    {
      db,
      host,
      password,
      port,
    }: {
      db?: number;
      host: string;
      password?: string;
      port: number;
    },
    private readonly maxRequests: number = 5,
  ) {
    this.client = new Redis({
      db,
      host,
      password,
      port,
      maxRetriesPerRequest: 3,
    });

    this.client.on("connect", () => {
      console.log("---------------- REDIS IS CONNECTED ----------------------");
    });

    this.client.on("error", (err: unknown) => {
      console.log(
        "------------------ REDIS ERROR START -------------------------",
      );
      console.log(err);
      console.log(
        "------------------ REDIS ERROR END  -------------------------",
      );
    });
  }

  async allowed({
    ip,
    address,
  }: {
    ip: string;
    address: Address;
  }): Promise<boolean> {
    const windowS = 60;
    let allowed = true;
    for (const key of [ip, address]) {
      const fmtKey = `ratelimit:${key}`;

      const currentRequests = await this.client.incr(fmtKey);

      if (currentRequests === 1) {
        await this.client.expire(fmtKey, windowS);
      }

      allowed = this.maxRequests > currentRequests;
      if (!allowed) {
        return false;
      }
    }
    return true;
  }
}

export async function buildRedisService() {
  return new RedisService({
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: !Number.isNaN(REDIS_DB) ? REDIS_DB : undefined,
    password: REDIS_PASSWORD,
  });
}
