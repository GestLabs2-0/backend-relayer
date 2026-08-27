// types/relayer.ts

import type { Address, Transaction } from "@solana/kit";
import type { Request, Response } from "express";

// ─── Base types (los tuyos) ───────────────────────────────────────────────────
export type Send<ResBody, T> = (body: ResBody) => T;

export interface TypedResponse<ResBody> extends Response {
  json: Send<ResBody, this>;
}

export interface RequestAPI<T = object, P = Record<string, string>, Q = object>
  extends Request {
  body: T | undefined;
  params: P & Record<string, string>;
  query: Q & Record<string, string | string[]>;
}

export interface ResponseI<T = unknown> {
  data?: T;
  status: boolean;
  message: string[] | string;
  errors?: string[];
}

export interface ResponseAPI<T = unknown> extends TypedResponse<ResponseI<T>> {}

// ─── Relayer request bodies ───────────────────────────────────────────────────

export interface CosignBody {
  tx: string | Transaction; // base64 serialized Transaction
  address: string; // signer pubkey (user's wallet)
}

export interface CosignBodyParsed {
  tx: Transaction; // base64 serialized Transaction
  address: Address; // signer pubkey (user's wallet)
}

// ─── Relayer response data ────────────────────────────────────────────────────

export interface CosignResponse {
  tx: string; // base64 cosigned Transaction
  feePayer: string; // relayer pubkey — útil para que el frontend valide
}

export interface RateLimitResponse {
  retryAfter: number; // segundos hasta que se resetea la ventana
}

// ─── Relayer handler types ────────────────────────────────────────────────────

export type CosignRequestRaw = RequestAPI<CosignBody>;
export type CosignRequest = RequestAPI<CosignBodyParsed>;

export type CosignResponseAPI = ResponseAPI<CosignResponse>;

// Para errores y rate limit reutilizas ResponseAPI<RateLimitResponse>
// o ResponseAPI<never> con status: false y message descriptivo
