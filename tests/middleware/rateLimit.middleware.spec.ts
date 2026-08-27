import { address, type Transaction } from "@solana/kit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RateLimit } from "../../src/libs/redis.service.js";
import { RateLimitMiddleware } from "../../src/middleware/rateLimit.middleware.js";
import type {
  CosignRequest,
  ResponseAPI,
} from "../../src/typescript/express.js";
import { createTestTransaction } from "../helpers/solana.helper.js";

describe("RateLimitMiddleware", () => {
  let mockRateLimiter: RateLimit;
  let middleware: RateLimitMiddleware;
  const dummyAddress = address("11111111111111111111111111111111");

  beforeEach(() => {
    mockRateLimiter = {
      allowed: vi.fn(),
    };
    middleware = new RateLimitMiddleware(mockRateLimiter);
  });

  it("should return 400 if req.body is missing", async () => {
    const req = { body: undefined } as unknown as CosignRequest;
    const resJson = vi.fn();
    const resStatus = vi.fn().mockReturnValue({ json: resJson });
    const res = { status: resStatus } as unknown as ResponseAPI;
    const next = vi.fn();

    await middleware.middleware(req, res, next);

    expect(resStatus).toHaveBeenCalledWith(400);
    expect(resJson).toHaveBeenCalledWith({
      message: "Missing body",
      status: false,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 400 if tx or address is missing in req.body", async () => {
    const resJson = vi.fn();
    const resStatus = vi.fn().mockReturnValue({ json: resJson });
    const res = { status: resStatus } as unknown as ResponseAPI;
    const next = vi.fn();

    const reqWithoutAddress = {
      body: { tx: {} as unknown as Transaction },
    } as unknown as CosignRequest;
    await middleware.middleware(reqWithoutAddress, res, next);

    expect(resStatus).toHaveBeenCalledWith(400);
    expect(resJson).toHaveBeenCalledWith({
      message: "Missing tx or address",
      status: false,
    });
    expect(next).not.toHaveBeenCalled();

    const reqWithoutTx = {
      body: { address: dummyAddress },
    } as unknown as CosignRequest;
    await middleware.middleware(reqWithoutTx, res, next);

    expect(resStatus).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("should parse first IP from x-forwarded-for header and pass to rateLimiter", async () => {
    const { signedTxByUser } = await createTestTransaction();
    (mockRateLimiter.allowed as ReturnType<typeof vi.fn>).mockResolvedValue(
      true,
    );

    const req = {
      body: { tx: signedTxByUser, address: dummyAddress },
      headers: {
        "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
      },
    } as unknown as CosignRequest;
    const res = {} as ResponseAPI;
    const next = vi.fn();

    await middleware.middleware(req, res, next);

    expect(mockRateLimiter.allowed).toHaveBeenCalledWith({
      ip: "203.0.113.195",
      address: dummyAddress,
    });
    expect(next).toHaveBeenCalled();
  });

  it("should default to 'unknown' IP if x-forwarded-for header is missing", async () => {
    const { signedTxByUser } = await createTestTransaction();
    (mockRateLimiter.allowed as ReturnType<typeof vi.fn>).mockResolvedValue(
      true,
    );

    const req = {
      body: { tx: signedTxByUser, address: dummyAddress },
      headers: {},
    } as unknown as CosignRequest;
    const res = {} as ResponseAPI;
    const next = vi.fn();

    await middleware.middleware(req, res, next);

    expect(mockRateLimiter.allowed).toHaveBeenCalledWith({
      ip: "unknown",
      address: dummyAddress,
    });
    expect(next).toHaveBeenCalled();
  });

  it("should return 429 when rateLimiter returns false", async () => {
    const { signedTxByUser } = await createTestTransaction();
    (mockRateLimiter.allowed as ReturnType<typeof vi.fn>).mockResolvedValue(
      false,
    );

    const req = {
      body: { tx: signedTxByUser, address: dummyAddress },
      headers: {},
    } as unknown as CosignRequest;
    const resJson = vi.fn();
    const resStatus = vi.fn().mockReturnValue({ json: resJson });
    const res = { status: resStatus } as unknown as ResponseAPI;
    const next = vi.fn();

    await middleware.middleware(req, res, next);

    expect(resStatus).toHaveBeenCalledWith(429);
    expect(resJson).toHaveBeenCalledWith({
      message: "Rate limit exceeded",
      status: false,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next() when rateLimiter returns true", async () => {
    const { signedTxByUser } = await createTestTransaction();
    (mockRateLimiter.allowed as ReturnType<typeof vi.fn>).mockResolvedValue(
      true,
    );

    const req = {
      body: { tx: signedTxByUser, address: dummyAddress },
      headers: {},
    } as unknown as CosignRequest;
    const res = {} as ResponseAPI;
    const next = vi.fn();

    await middleware.middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
