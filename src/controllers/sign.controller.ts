import type { Transaction } from "@solana/kit";
import { getTransactionEncoder } from "@solana/kit";
import type { SignService } from "#libs/solana.service.js";
import type { CosignRequest, CosignResponseAPI } from "#typescript/express.js";

export function encodeTransactionToBase64(tx: Transaction): string {
  const bytes = getTransactionEncoder().encode(tx);
  return Buffer.from(bytes).toString("base64");
}

export class SignController {
  constructor(private readonly signer: SignService) {}

  cosign = async (req: CosignRequest, res: CosignResponseAPI) => {
    if (!req.body) {
      return res.status(400).json({ message: "Missing body", status: false });
    }

    const { tx } = req.body;
    try {
      const signedTx = await this.signer.sign(tx);

      return res.status(200).json({
        data: {
          tx: encodeTransactionToBase64(signedTx),
          feePayer: this.signer.getFeePayer(),
        },
        status: true,
        message: "Transaccion firmada exitosamente",
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        status: false,
        message: "Error signing transaction",
      });
    }
  };
}
