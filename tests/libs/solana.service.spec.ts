import { createKeychainSigner } from "@solana/keychain";
import { describe, expect, it } from "vitest";
import {
  createSolanaService,
  SolanaService,
} from "../../src/libs/solana.service.js";
import { createTestTransaction } from "../helpers/solana.helper.js";

describe("SolanaService", () => {
  it("should return the fee payer address from the signer", async () => {
    const signer = await createKeychainSigner({
      backend: "memory",
      privateKey: new Uint8Array(32).fill(2),
    });
    const solanaService = new SolanaService(signer);

    expect(solanaService.getFeePayer()).toBe(signer.address);
  });

  it("should cosign a valid transaction", async () => {
    const signer = await createKeychainSigner({
      backend: "memory",
      privateKey: new Uint8Array(32).fill(2),
    });
    const solanaService = new SolanaService(signer);

    const { signedTxByUser } = await createTestTransaction({
      feePayerSeed: 2,
      userSeed: 1,
    });

    const cosignedTx = await solanaService.sign(signedTxByUser);

    expect(cosignedTx).toBeDefined();
    expect(cosignedTx.signatures[signer.address]).toBeDefined();
    expect(cosignedTx.signatures[signer.address]).not.toBeNull();
  });

  it("should create a SolanaService instance via factory function", async () => {
    const service = await createSolanaService();
    expect(service).toBeInstanceOf(SolanaService);
    expect(typeof service.getFeePayer()).toBe("string");
  });
});
