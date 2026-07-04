import { createPaymentProof, makeHash } from "./charon";
import { KLEOS_AGENT_WALLET } from "./config";
import { buildGatewayRequirement, verifyAndSettleGatewayPayment } from "./gateway-x402";
import { getStore } from "./store";
import { runSponsoredTrial } from "./sponsored-trial";

const A2A_PRICE_USDC = 0.004;

export function createA2AChallenge(origin: string) {
  const requirement = buildGatewayRequirement(A2A_PRICE_USDC);

  return {
    x402Version: 2,
    resource: {
      url: `${origin}/api/a2a/ask`,
      description: "Kleos A2A paid grounded-answer settlement run",
      mimeType: "application/json",
    },
    accepts: [requirement],
    localDevelopmentFallback: createPaymentProof("a2a-ask", KLEOS_AGENT_WALLET),
  };
}

function isLocalProof(signature: string | null) {
  return Boolean(signature?.startsWith("kleos-payment-proof:"));
}

export async function runA2AAsk(input: {
  origin: string;
  paymentSignature: string | null;
  question?: string;
  budgetUsdc?: number;
}) {
  const signature = input.paymentSignature;
  let paymentMode: "local-development-proof" | "circle-gateway" = "local-development-proof";
  let payer = KLEOS_AGENT_WALLET;
  let gatewayTransaction: string | undefined;

  if (!signature) {
    return {
      ok: false as const,
      status: 402,
      challenge: createA2AChallenge(input.origin),
      encodedChallenge: Buffer.from(JSON.stringify(createA2AChallenge(input.origin))).toString("base64"),
    };
  }

  if (!isLocalProof(signature)) {
    const livePayment = await verifyAndSettleGatewayPayment({
      paymentSignature: signature,
      priceUsdc: A2A_PRICE_USDC,
    });

    if (!livePayment.ok) {
      return {
        ok: false as const,
        status: 402,
        reason: livePayment.reason,
        challenge: createA2AChallenge(input.origin),
        encodedChallenge: Buffer.from(JSON.stringify(createA2AChallenge(input.origin))).toString("base64"),
      };
    }

    paymentMode = "circle-gateway";
    payer = livePayment.payer;
    gatewayTransaction = livePayment.transaction;
  }

  const trial = runSponsoredTrial({
    task:
      input.question?.trim() ||
      "Produce a grounded answer using Kleos paid source inspection, citation settlement, and creator payout proofs.",
    budgetUsdc: input.budgetUsdc,
  });
  const digest = makeHash(
    `${trial.citations.settlement.id}:${trial.citations.settlement.answerHash}:${signature}:${paymentMode}`,
  );

  getStore().agentTrustEvents.unshift({
    id: `ate_a2a_${Date.now().toString(36)}`,
    title: "Agent-to-agent paid research",
    network: "Arc Testnet",
    status: gatewayTransaction ? "settled" : "signed_bound",
    amountUsdc: A2A_PRICE_USDC,
    agent: payer,
    counterparty: "kleos://a2a/ask",
    contractAddress: "A2AResearchAdapter-ready",
    digest,
    txHash: gatewayTransaction,
    note:
      "External agent paid Kleos for a grounded-answer run; Kleos then paid creator sources, finalized citation tolls, and emitted answer proof records.",
    createdAt: new Date().toISOString(),
  });

  return {
    ok: true as const,
    status: 200,
    payment: {
      mode: paymentMode,
      priceUsdc: A2A_PRICE_USDC,
      payer,
      gatewayTransaction,
      proofDigest: digest,
    },
    answer: trial.citations.settlement.answer,
    answerHash: trial.citations.settlement.answerHash,
    settlementId: trial.citations.settlement.id,
    readTollUsdc: trial.citations.settlement.readTollUsdc,
    citationTollUsdc: trial.citations.settlement.citationTollUsdc,
    citedItemIds: trial.citations.settlement.citedItemIds,
    citationReceipts: trial.citations.citationReceipts,
    impactGrants: trial.impact.impactGrants,
    pricingEvents: trial.pricingEvents,
  };
}
