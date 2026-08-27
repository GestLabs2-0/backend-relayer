import { address } from "@solana/kit";
import type { NextFunction } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  decodeTransactionFromBase64,
  validateTxMiddleware,
} from "../../src/middleware/validateTx.middleware.js";
import type {
  CosignBodyParsed,
  CosignRequestRaw,
  ResponseAPI,
} from "../../src/typescript/express.js";
import {
  createTestTransaction,
  TEST_ALLOWED_PROGRAM,
  TEST_UNAUTHORIZED_PROGRAM,
} from "../helpers/solana.helper.js";

describe("validateTxMiddleware", () => {
  let resJson: ReturnType<typeof vi.fn>;
  let resStatus: ReturnType<typeof vi.fn>;
  let res: ResponseAPI;
  let next: NextFunction;

  beforeEach(() => {
    resJson = vi.fn();
    resStatus = vi.fn().mockReturnValue({ json: resJson });
    res = { status: resStatus } as unknown as ResponseAPI;
    next = vi.fn() as unknown as NextFunction;
  });

  describe("decodeTransactionFromBase64", () => {
    it("should decode a valid base64 transaction and its compiled message", async () => {
      const { base64, signedTxByUser } = await createTestTransaction();
      const decoded = decodeTransactionFromBase64(base64);

      expect(decoded.tx).toBeDefined();
      expect(decoded.msg).toBeDefined();
      expect(decoded.tx.signatures).toEqual(signedTxByUser.signatures);
    });
  });

  describe("middleware execution", () => {
    it("should return 400 if req.body is missing", () => {
      const req = { body: undefined } as unknown as CosignRequestRaw;

      validateTxMiddleware(req, res, next);

      expect(resStatus).toHaveBeenCalledWith(400);
      expect(resJson).toHaveBeenCalledWith({
        message: "Missing body",
        status: false,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 if tx is not a string", () => {
      const req = {
        body: { tx: 12345, address: "dummy" },
      } as unknown as CosignRequestRaw;

      validateTxMiddleware(req, res, next);

      expect(resStatus).toHaveBeenCalledWith(400);
      expect(resJson).toHaveBeenCalledWith({
        status: false,
        message: "Transaction is not in base64",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 if transaction uses an unauthorized program", async () => {
      const { base64, user } = await createTestTransaction({
        programAddress: TEST_UNAUTHORIZED_PROGRAM,
      });

      const req = {
        body: { tx: base64, address: user.address },
      } as unknown as CosignRequestRaw;

      validateTxMiddleware(req, res, next);

      expect(resStatus).toHaveBeenCalledWith(400);
      expect(resJson).toHaveBeenCalledWith({
        status: false,
        message: `Unauthorized program: ${TEST_UNAUTHORIZED_PROGRAM}`,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 if rawAddress is invalid/malformed", async () => {
      const { base64 } = await createTestTransaction({
        programAddress: TEST_ALLOWED_PROGRAM,
      });

      const req = {
        body: { tx: base64, address: "not-a-valid-solana-address!!!" },
      } as unknown as CosignRequestRaw;

      validateTxMiddleware(req, res, next);

      expect(resStatus).toHaveBeenCalledWith(400);
      expect(resJson).toHaveBeenCalledWith({
        status: false,
        message: "Missing Solana address",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 if address is not a signer in the transaction", async () => {
      const { base64 } = await createTestTransaction({
        programAddress: TEST_ALLOWED_PROGRAM,
        includeUserAsSigner: false,
      });
      const otherAddress = address(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      );

      const req = {
        body: { tx: base64, address: otherAddress },
      } as unknown as CosignRequestRaw;

      validateTxMiddleware(req, res, next);

      expect(resStatus).toHaveBeenCalledWith(400);
      expect(resJson).toHaveBeenCalledWith({
        status: false,
        message: "Address is not a signer in this transaction",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should set parsed body and call next() for valid transaction and authorized program", async () => {
      const { base64, user } = await createTestTransaction({
        programAddress: TEST_ALLOWED_PROGRAM,
      });

      const req = {
        body: { tx: base64, address: user.address },
      } as unknown as CosignRequestRaw;

      validateTxMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toBeDefined();
      const parsedBody = req.body as unknown as CosignBodyParsed;
      expect(parsedBody.address).toBe(user.address);
      expect(parsedBody.tx).toBeDefined();
      expect(resStatus).not.toHaveBeenCalled();
    });
  });
});
