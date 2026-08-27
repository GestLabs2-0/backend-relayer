import { type Express, Router } from "express";
import { SignController } from "#controllers/sign.controller.js";
import { buildRedisService } from "#libs/redis.service.js";
import { createSolanaService } from "#libs/solana.service.js";
import { RateLimitMiddleware } from "#middleware/rateLimit.middleware.js";
import { validateTxMiddleware } from "#middleware/validateTx.middleware.js";

const redisService = await buildRedisService();
const solanaService = await createSolanaService();
const rateLimitMiddleware = new RateLimitMiddleware(redisService);
const signController = new SignController(solanaService);

export const routes = (app: Express): Express => {
  const router = Router();

  return app.use(
    "/api/v1.0",
    router.post(
      "/cosign",
      validateTxMiddleware,
      rateLimitMiddleware.middleware,
      signController.cosign,
    ),
  );
};
