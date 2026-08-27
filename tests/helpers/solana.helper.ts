import {
  type Address,
  address,
  appendTransactionMessageInstruction,
  type Blockhash,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  getTransactionEncoder,
  partiallySignTransactionMessageWithSigners,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";

export const TEST_ALLOWED_PROGRAM = address("11111111111111111111111111111111");
export const TEST_UNAUTHORIZED_PROGRAM = address(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

export async function createTestTransaction({
  feePayerSeed = 2,
  userSeed = 1,
  programAddress = TEST_ALLOWED_PROGRAM,
  includeUserAsSigner = true,
}: {
  feePayerSeed?: number;
  userSeed?: number;
  programAddress?: Address;
  includeUserAsSigner?: boolean;
} = {}) {
  const feePayer = await createKeyPairSignerFromPrivateKeyBytes(
    new Uint8Array(32).fill(feePayerSeed),
  );
  const user = await createKeyPairSignerFromPrivateKeyBytes(
    new Uint8Array(32).fill(userSeed),
  );

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(feePayer, m),
    (m) =>
      setTransactionMessageLifetimeUsingBlockhash(
        {
          blockhash:
            "4vJ9JU1bJJE96FWSXTv2NghVwHPBL45zMSY1h43HdW4D" as Blockhash,
          lastValidBlockHeight: 100n,
        },
        m,
      ),
    (m) =>
      appendTransactionMessageInstruction(
        {
          programAddress,
          accounts: includeUserAsSigner
            ? [{ address: user.address, role: 2 /* Signer */ }]
            : [{ address: user.address, role: 0 /* Readonly */ }],
          data: new Uint8Array([1, 2, 3]),
        },
        m,
      ),
  );

  const signedTxByUser =
    await partiallySignTransactionMessageWithSigners(message);
  const bytes = getTransactionEncoder().encode(signedTxByUser);
  const base64 = Buffer.from(bytes).toString("base64");

  return {
    feePayer,
    user,
    signedTxByUser,
    base64,
  };
}
