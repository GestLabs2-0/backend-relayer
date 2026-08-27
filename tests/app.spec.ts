import type { Server } from "node:http";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import app from "../src/app.js";
import type { CosignResponse, ResponseI } from "../src/typescript/express.js";
import {
  createTestTransaction,
  TEST_ALLOWED_PROGRAM,
  TEST_UNAUTHORIZED_PROGRAM,
} from "./helpers/solana.helper.js";

// Mock ioredis so app.ts doesn't require a live Redis instance
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

describe("App Integration Tests", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addressInfo = server.address();
        if (addressInfo && typeof addressInfo === "object") {
          baseUrl = `http://127.0.0.1:${addressInfo.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockIncr.mockResolvedValue(1);
    mockExpire.mockResolvedValue(1);
  });

  describe("GET /status", () => {
    it("should return 200 and server status", async () => {
      const response = await fetch(`${baseUrl}/status`);
      const data = (await response.json()) as ResponseI;

      expect(response.status).toBe(200);
      expect(data).toEqual({
        status: true,
        message: "Active and running server!",
      });
    });
  });

  describe("404 Not Found fallback", () => {
    it("should return 404 for undefined endpoints", async () => {
      const response = await fetch(`${baseUrl}/unregistered-route`);
      const data = (await response.json()) as { error: string };

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: "404 - requested resource not found",
      });
    });
  });

  describe("CORS behavior", () => {
    it("should allow requests from allowed origins", async () => {
      const response = await fetch(`${baseUrl}/status`, {
        headers: {
          Origin: "http://localhost:3000",
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe(
        "http://localhost:3000",
      );
    });

    it("should allow requests from secondary allowed origin", async () => {
      const response = await fetch(`${baseUrl}/status`, {
        headers: {
          Origin: "http://localhost:5173",
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe(
        "http://localhost:5173",
      );
    });

    it("should not reflect origin header for unallowed origins", async () => {
      const response = await fetch(`${baseUrl}/status`, {
        headers: {
          Origin: "http://malicious-site.com",
        },
      });

      expect(response.headers.get("access-control-allow-origin")).toBeNull();
    });

    it("should handle requests without Origin header", async () => {
      const response = await fetch(`${baseUrl}/status`);
      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBeNull();
    });
  });

  describe("POST /api/v1.0/cosign", () => {
    it("should return 400 for invalid body payload", async () => {
      const response = await fetch(`${baseUrl}/api/v1.0/cosign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx: 12345 }),
      });

      const data = (await response.json()) as ResponseI;
      expect(response.status).toBe(400);
      expect(data.status).toBe(false);
    });

    it("should return 400 when transaction uses unauthorized program", async () => {
      const { base64, user } = await createTestTransaction({
        programAddress: TEST_UNAUTHORIZED_PROGRAM,
      });

      const response = await fetch(`${baseUrl}/api/v1.0/cosign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          tx: base64,
          address: user.address,
        }),
      });

      const data = (await response.json()) as ResponseI;
      expect(response.status).toBe(400);
      expect(data.status).toBe(false);
      expect(data.message).toContain("Unauthorized program");
    });

    it("should return 429 when rate limiter limit is exceeded", async () => {
      mockIncr.mockResolvedValue(10); // Exceeds limit

      const { base64, user } = await createTestTransaction({
        programAddress: TEST_ALLOWED_PROGRAM,
      });

      const response = await fetch(`${baseUrl}/api/v1.0/cosign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          tx: base64,
          address: user.address,
        }),
      });

      const data = (await response.json()) as ResponseI;
      expect(response.status).toBe(429);
      expect(data.status).toBe(false);
      expect(data.message).toBe("Rate limit exceeded");
    });

    it("should successfully cosign transaction and return 200", async () => {
      const { base64, user } = await createTestTransaction({
        programAddress: TEST_ALLOWED_PROGRAM,
        feePayerSeed: 2,
      });

      const response = await fetch(`${baseUrl}/api/v1.0/cosign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          tx: base64,
          address: user.address,
        }),
      });

      const data = (await response.json()) as ResponseI<CosignResponse>;
      expect(response.status).toBe(200);
      expect(data.status).toBe(true);
      expect(data.message).toBe("Transaccion firmada exitosamente");
      expect(data.data?.tx).toBeDefined();
      expect(typeof data.data?.tx).toBe("string");
      expect(data.data?.feePayer).toBeDefined();
    });
  });
});
