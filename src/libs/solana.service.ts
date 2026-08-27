import { createKeychainSigner, type SolanaSigner } from "@solana/keychain";
import {
  type Address,
  partiallySignTransactionWithSigners,
  type Transaction,
} from "@solana/kit";
import { RELAYER_KEYPAIR } from "#constants.js";

export interface SignService {
  sign(tx: Transaction): Promise<Transaction>;
  getFeePayer(): Address;
}

export class SolanaService implements SignService {
  private readonly signer: SolanaSigner;

  constructor(signer: SolanaSigner) {
    this.signer = signer;
  }

  getFeePayer(): Address {
    return this.signer.address;
  }

  async sign(tx: Transaction): Promise<Transaction> {
    return await partiallySignTransactionWithSigners([this.signer], tx);
  }
}

export async function createSolanaService(): Promise<SolanaService> {
  const signer = await createKeychainSigner({
    backend: "memory",
    privateKey: RELAYER_KEYPAIR,
  });
  return new SolanaService(signer);
}
