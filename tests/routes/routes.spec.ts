import express from "express";
import { describe, expect, it } from "vitest";
import { routes } from "../../src/routes/index.js";

describe("routes", () => {
  it("should mount routes on an express application", () => {
    const app = express();
    const result = routes(app);

    expect(result).toBe(app);
  });
});
