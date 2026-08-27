import type { NextFunction } from "express";
import type { RateLimit } from "#libs/redis.service.js";
import type { CosignRequest, ResponseAPI } from "#typescript/express.js";

export class RateLimitMiddleware {
  constructor(private readonly rateLimiter: RateLimit) {}

  middleware = async (
    req: CosignRequest,
    res: ResponseAPI,
    next: NextFunction,
  ) => {
    if (!req.body) {
      return res.status(400).json({ message: "Missing body", status: false });
    }

    const { tx, address } = req.body;

    if (!tx || !address) {
      return res
        .status(400)
        .json({ message: "Missing tx or address", status: false });
    }

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? "unknown";

    const allowed = await this.rateLimiter.allowed({
      ip,
      address,
    });

    if (!allowed) {
      return res
        .status(429)
        .json({ message: "Rate limit exceeded", status: false });
    }

    next();
  };
}
