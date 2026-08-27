import {
  type Address,
  address as addressBuilder,
  getCompiledTransactionMessageDecoder,
  getTransactionDecoder,
} from "@solana/kit";
import type { NextFunction } from "express";
import { ALLOWED_PROGRAMS } from "#constants.js";
import type { CosignRequestRaw, ResponseAPI } from "#typescript/express.js";

export function decodeTransactionFromBase64(base64: string) {
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
  const decoder = getTransactionDecoder();
  const tx = decoder.decode(bytes);

  const messageDecoder = getCompiledTransactionMessageDecoder();
  const msg = messageDecoder.decode(tx.messageBytes);

  return { tx, msg };
}

export function validateTxMiddleware(
  req: CosignRequestRaw,
  res: ResponseAPI,
  next: NextFunction,
) {
  if (!req.body) {
    return res.status(400).json({ message: "Missing body", status: false });
  }

  const { tx: txRaw, address: rawAddress } = req.body;

  if (typeof txRaw !== "string") {
    return res
      .status(400)
      .json({ status: false, message: "Transaction is not in base64" });
  }

  const { tx, msg } = decodeTransactionFromBase64(txRaw);

  if ("instructions" in msg && Array.isArray(msg.instructions)) {
    for (const ix of msg.instructions) {
      const programAddress = msg.staticAccounts[ix.programAddressIndex];
      if (!programAddress || !ALLOWED_PROGRAMS.has(programAddress)) {
        return res.status(400).json({
          status: false,
          message: `Unauthorized program: ${programAddress}`,
        });
      }
    }
  }

  let address: Address;

  try {
    address = addressBuilder(rawAddress);
  } catch {
    return res
      .status(400)
      .json({ status: false, message: "Missing Solana address" });
  }

  // Verificar que el address declarado es signer en la tx
  const signerKeys = Object.keys(tx.signatures);

  if (!signerKeys.includes(address)) {
    return res.status(400).json({
      status: false,
      message: "Address is not a signer in this transaction",
    });
  }

  req.body = {
    address,
    tx,
  };

  next();
}
