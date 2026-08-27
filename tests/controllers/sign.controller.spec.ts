import { address } from "@solana/kit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  encodeTransactionToBase64,
  SignController,
} from "../../src/controllers/sign.controller.js";
import type { SignService } from "../../src/libs/solana.service.js";
import type {
  CosignRequest,
  CosignResponseAPI,
} from "../../src/typescript/express.js";
import { createTestTransaction } from "../helpers/solana.helper.js";

describe("SignController", () => {
  let mockSigner: SignService;
  let controller: SignController;

  const mockFeePayer = address("9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu");

  beforeEach(() => {
    mockSigner = {
      sign: vi.fn(),
      getFeePayer: vi.fn().mockReturnValue(mockFeePayer),
    };
    controller = new SignController(mockSigner);
  });

  describe("encodeTransactionToBase64", () => {
    it("should encode a transaction to a base64 string", async () => {
      const { signedTxByUser } = await createTestTransaction();
      const base64 = encodeTransactionToBase64(signedTxByUser);

      expect(typeof base64).toBe("string");
      expect(base64.length).toBeGreaterThan(0);
      expect(() => Buffer.from(base64, "base64")).not.toThrow();
    });
  });

  describe("cosign", () => {
    it("should return 400 if request body is missing", async () => {
      const req = { body: undefined } as unknown as CosignRequest;
      const resJson = vi.fn();
      const resStatus = vi.fn().mockReturnValue({ json: resJson });
      const res = { status: resStatus } as unknown as CosignResponseAPI;

      await controller.cosign(req, res);

      expect(resStatus).toHaveBeenCalledWith(400);
      expect(resJson).toHaveBeenCalledWith({
        message: "Missing body",
        status: false,
      });
    });

    it("should cosign transaction and return 200 on success", async () => {
      const { signedTxByUser } = await createTestTransaction();
      (mockSigner.sign as ReturnType<typeof vi.fn>).mockResolvedValue(
        signedTxByUser,
      );

      const req = {
        body: {
          tx: signedTxByUser,
          address: mockFeePayer,
        },
      } as unknown as CosignRequest;

      const resJson = vi.fn();
      const resStatus = vi.fn().mockReturnValue({ json: resJson });
      const res = { status: resStatus } as unknown as CosignResponseAPI;

      await controller.cosign(req, res);

      expect(resStatus).toHaveBeenCalledWith(200);
      expect(mockSigner.sign).toHaveBeenCalledWith(signedTxByUser);
      expect(mockSigner.getFeePayer).toHaveBeenCalled();
      expect(resJson).toHaveBeenCalledWith({
        data: {
          tx: expect.any(String),
          feePayer: mockFeePayer,
        },
        status: true,
        message: "Transaccion firmada exitosamente",
      });
    });

    it("should return 500 when signer throws an error", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const { signedTxByUser } = await createTestTransaction();
      (mockSigner.sign as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Signing failed"),
      );

      const req = {
        body: {
          tx: signedTxByUser,
          address: mockFeePayer,
        },
      } as unknown as CosignRequest;

      const resJson = vi.fn();
      const resStatus = vi.fn().mockReturnValue({ json: resJson });
      const res = { status: resStatus } as unknown as CosignResponseAPI;

      await controller.cosign(req, res);

      expect(resStatus).toHaveBeenCalledWith(500);
      expect(resJson).toHaveBeenCalledWith({
        status: false,
        message: "Error signing transaction",
      });

      consoleSpy.mockRestore();
    });
  });
});
