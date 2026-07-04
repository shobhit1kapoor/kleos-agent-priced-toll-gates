import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import {
  ARC_TESTNET_GATEWAY_WALLET,
  ARC_TESTNET_NETWORK,
  ARC_TESTNET_USDC,
  KLEOS_SELLER_WALLET,
} from "./config";

export type GatewayPaymentRequirement = {
  scheme: "exact";
  network: typeof ARC_TESTNET_NETWORK;
  asset: typeof ARC_TESTNET_USDC;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: {
    name: "GatewayWalletBatched";
    version: "1";
    verifyingContract: typeof ARC_TESTNET_GATEWAY_WALLET;
  };
};

export type GatewayPaymentRequiredPayload = {
  x402Version: 2;
  resource: {
    url: string;
    description: string;
    mimeType: "application/json";
  };
  accepts: GatewayPaymentRequirement[];
};

type PaymentPayload = {
  x402Version: number;
  resource?: { url: string; description: string; mimeType: string };
  accepted?: Record<string, unknown>;
  payload: Record<string, unknown>;
  extensions?: Record<string, unknown>;
};

type LiveGatewayResult =
  | {
      ok: true;
      mode: "live";
      payer: string;
      transaction?: string;
      responseHeader: string;
    }
  | {
      ok: false;
      reason: string;
    };

const facilitator = new BatchFacilitatorClient();

export function amountToAtomicUsdc(priceUsdc: number) {
  return Math.round(priceUsdc * 1_000_000).toString();
}

export function buildGatewayRequirement(priceUsdc: number): GatewayPaymentRequirement {
  return {
    scheme: "exact",
    network: ARC_TESTNET_NETWORK,
    asset: ARC_TESTNET_USDC,
    amount: amountToAtomicUsdc(priceUsdc),
    payTo: KLEOS_SELLER_WALLET,
    maxTimeoutSeconds: 345600,
    extra: {
      name: "GatewayWalletBatched",
      version: "1",
      verifyingContract: ARC_TESTNET_GATEWAY_WALLET,
    },
  };
}

export function buildPaymentRequiredPayload(input: {
  url: string;
  title: string;
  priceUsdc: number;
}): GatewayPaymentRequiredPayload {
  return {
    x402Version: 2,
    resource: {
      url: input.url,
      description: `Kleos paid source: ${input.title}`,
      mimeType: "application/json",
    },
    accepts: [buildGatewayRequirement(input.priceUsdc)],
  };
}

export function isLocalPaymentProof(signature: string | null) {
  return Boolean(signature?.startsWith("kleos-payment-proof:"));
}

export async function verifyAndSettleGatewayPayment(input: {
  paymentSignature: string;
  priceUsdc: number;
}): Promise<LiveGatewayResult> {
  let paymentPayload: PaymentPayload;

  try {
    paymentPayload = JSON.parse(
      Buffer.from(input.paymentSignature, "base64").toString("utf-8"),
    ) as PaymentPayload;
  } catch {
    return { ok: false, reason: "PAYMENT-SIGNATURE is not a base64 x402 payload." };
  }

  const requirements = buildGatewayRequirement(input.priceUsdc);
  const verifyResult = await facilitator.verify(paymentPayload, requirements);
  if (!verifyResult.isValid) {
    return {
      ok: false,
      reason: verifyResult.invalidReason ?? "Circle Gateway verification failed.",
    };
  }

  const settleResult = await facilitator.settle(paymentPayload, requirements);
  if (!settleResult.success) {
    return {
      ok: false,
      reason: settleResult.errorReason ?? "Circle Gateway settlement failed.",
    };
  }

  const payer = settleResult.payer ?? verifyResult.payer ?? "unknown";
  const responseHeader = Buffer.from(
    JSON.stringify({
      success: true,
      transaction: settleResult.transaction,
      network: requirements.network,
      payer,
    }),
  ).toString("base64");

  return {
    ok: true,
    mode: "live",
    payer,
    transaction: settleResult.transaction,
    responseHeader,
  };
}
