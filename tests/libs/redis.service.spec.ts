import { address } from "@solana/kit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildRedisService,
  RedisService,
} from "../../src/libs/redis.service.js";

// Mock ioredis
const { mockIncr, mockExpire, mockOn } = vi.hoisted(() => ({
  mockIncr: vi.fn(),
  mockExpire: vi.fn(),
  mockOn: vi.fn(),
}));

vi.mock("ioredis", () => {
  class MockRedis {
    incr = mockIncr;
    expire = mockExpire;
    on = mockOn;
  }
  return {
    Redis: MockRedis,
    default: MockRedis,
  };
});

describe("RedisService", () => {
  const dummyAddress = address("11111111111111111111111111111111");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize Redis and attach connect and error event handlers", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    new RedisService({ host: "127.0.0.1", port: 6379 });

    expect(mockOn).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("error", expect.any(Function));

    // Trigger connect callback
    const connectHandler = mockOn.mock.calls.find(
      (c) => c[0] === "connect",
    )?.[1];
    connectHandler();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("REDIS IS CONNECTED"),
    );

    // Trigger error callback
    const errorHandler = mockOn.mock.calls.find((c) => c[0] === "error")?.[1];
    errorHandler(new Error("Test Redis connection error"));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("REDIS ERROR START"),
    );

    consoleSpy.mockRestore();
  });

  it("should allow request on first hit and set 60s expiration", async () => {
    mockIncr.mockResolvedValue(1);
    mockExpire.mockResolvedValue(1);

    const redisService = new RedisService({ host: "127.0.0.1", port: 6379 }, 5);
    const result = await redisService.allowed({
      ip: "127.0.0.1",
      address: dummyAddress,
    });

    expect(result).toBe(true);
    expect(mockIncr).toHaveBeenCalledWith("ratelimit:127.0.0.1");
    expect(mockIncr).toHaveBeenCalledWith(`ratelimit:${dummyAddress}`);
    expect(mockExpire).toHaveBeenCalledWith("ratelimit:127.0.0.1", 60);
    expect(mockExpire).toHaveBeenCalledWith(`ratelimit:${dummyAddress}`, 60);
  });

  it("should allow request on subsequent hits below maxRequests without re-expiring", async () => {
    mockIncr.mockResolvedValue(3);

    const redisService = new RedisService({ host: "127.0.0.1", port: 6379 }, 5);
    const result = await redisService.allowed({
      ip: "127.0.0.1",
      address: dummyAddress,
    });

    expect(result).toBe(true);
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it("should deny request if IP exceeds maxRequests", async () => {
    mockIncr.mockResolvedValueOnce(5); // maxRequests is 5, allowed = 5 > 5 (false)

    const redisService = new RedisService({ host: "127.0.0.1", port: 6379 }, 5);
    const result = await redisService.allowed({
      ip: "127.0.0.1",
      address: dummyAddress,
    });

    expect(result).toBe(false);
    expect(mockIncr).toHaveBeenCalledTimes(1); // address not checked after IP failure
  });

  it("should deny request if address exceeds maxRequests even if IP is allowed", async () => {
    mockIncr.mockResolvedValueOnce(2); // IP is allowed
    mockIncr.mockResolvedValueOnce(6); // Address exceeds

    const redisService = new RedisService({ host: "127.0.0.1", port: 6379 }, 5);
    const result = await redisService.allowed({
      ip: "127.0.0.1",
      address: dummyAddress,
    });

    expect(result).toBe(false);
    expect(mockIncr).toHaveBeenCalledTimes(2);
  });

  it("should build RedisService via buildRedisService helper", async () => {
    const service = await buildRedisService();
    expect(service).toBeInstanceOf(RedisService);
  });
});
