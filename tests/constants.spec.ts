import { address } from "@solana/kit";
import { describe, expect, it } from "vitest";
import {
  ALLOWED_PROGRAMS,
  CORS,
  PORT_APP,
  REDIS_DB,
  REDIS_HOST,
  REDIS_PORT,
  RELAYER_KEYPAIR,
} from "../src/constants.js";

describe("constants", () => {
  it("should correctly load and parse PORT_APP and CORS", () => {
    expect(PORT_APP).toBeDefined();
    expect(CORS).toBeDefined();
  });

  it("should correctly load and parse REDIS config", () => {
    expect(typeof REDIS_PORT).toBe("number");
    expect(typeof REDIS_HOST).toBe("string");
    expect(typeof REDIS_DB).toBe("number");
  });

  it("should populate ALLOWED_PROGRAMS Set with Address types", () => {
    expect(ALLOWED_PROGRAMS).toBeInstanceOf(Set);
    expect(ALLOWED_PROGRAMS.size).toBeGreaterThanOrEqual(1);
    expect(
      ALLOWED_PROGRAMS.has(address("11111111111111111111111111111111")),
    ).toBe(true);
  });

  it("should parse RELAYER_KEYPAIR as a Uint8Array", () => {
    expect(RELAYER_KEYPAIR).toBeInstanceOf(Uint8Array);
    expect(RELAYER_KEYPAIR.length).toBe(32);
  });
});
