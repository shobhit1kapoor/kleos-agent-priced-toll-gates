import { arcExplorerTxUrl, ARC_EXPLORER_TX_BASE, KLEOS_SELLER_WALLET } from "./config";
import { amountToAtomicUsdc, buildGatewayRequirement } from "./gateway-x402";
import { getContentItem, getStore } from "./store";
import type { CharonChallenge, Payment, PayoutSplit } from "./types";

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeHash(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return `0x${Math.abs(hash).toString(16).padStart(64, "0").slice(0, 64)}`;
}

export function createCharonChallenge(itemId: string, origin = ""): CharonChallenge {
  const item = getContentItem(itemId);
  if (!item) {
    throw new Error(`Unknown content item: ${itemId}`);
  }

  const amountAtomicUsdc = amountToAtomicUsdc(item.currentPriceUsdc);
  const requirement = buildGatewayRequirement(item.currentPriceUsdc);
  const resourcePath = `/api/content/${item.id}`;
  const resourceUrl = `${origin}${resourcePath}`;

  return {
    x402Version: 2,
    resourceDescriptor: {
      url: resourceUrl,
      description: `Kleos paid source: ${item.title}`,
      mimeType: "application/json",
    },
    protocol: "x402",
    scheme: "exact",
    network: "eip155:5042002",
    resource: resourcePath,
    priceUsdc: item.currentPriceUsdc,
    amountAtomicUsdc,
    destination: KLEOS_SELLER_WALLET,
    acceptedSchemes: [
      {
        scheme: "exact",
        network: "eip155:5042002",
        asset: requirement.asset,
        amount: requirement.amount,
        maxAmountRequired: amountAtomicUsdc,
        payTo: requirement.payTo,
        maxTimeoutSeconds: requirement.maxTimeoutSeconds,
        extra: {
          name: "GatewayWalletBatched",
          version: "1",
          verifyingContract: requirement.extra.verifyingContract,
          localDevelopmentFallback: "kleos-payment-proof",
        },
      },
    ],
    paymentHeader: "PAYMENT-SIGNATURE",
    gateway: "circle-gateway-nanopayments",
    instructions:
      "Sign an EIP-3009 Gateway authorization and retry with PAYMENT-SIGNATURE. Local verification accepts kleos-payment-proof:*.",
  };
}

export function isValidPaymentProof(signature: string | null, itemId: string) {
  void itemId;
  if (!signature) {
    return false;
  }

  return signature.startsWith("kleos-payment-proof:");
}

export function createPaymentProof(itemId: string, buyerWallet: string) {
  return `kleos-payment-proof:${buyerWallet}:${itemId}:${Date.now()}`;
}

export function recordUnpaidChallenge(itemId: string, sessionId = "direct_browser") {
  const store = getStore();
  const item = getContentItem(itemId);
  if (!item) {
    return;
  }

  store.purchaseAttempts.unshift({
    id: makeId("pa"),
    sessionId,
    itemId,
    quotedPriceUsdc: item.currentPriceUsdc,
    decision: "challenged",
    reason: "Charon returned a 402 challenge before content access.",
    createdAt: new Date().toISOString(),
  });
}

export function settlePayment(input: {
  itemId: string;
  sessionId: string;
  paymentSignature: string;
  kind?: Payment["kind"];
  amountUsdc?: number;
  settlementStatus?: Payment["settlementStatus"];
  gatewayTransferId?: string;
  explorerUrl?: string;
  payer?: string;
  liveGatewayTx?: string;
}): { payment: Payment; payoutSplits: PayoutSplit[] } {
  const store = getStore();
  const item = getContentItem(input.itemId);
  if (!item) {
    throw new Error(`Unknown content item: ${input.itemId}`);
  }

  const paymentId = makeId("pay");
  const txHash = makeHash(`${paymentId}:${input.itemId}:${input.paymentSignature}`);
  const amountUsdc = Number((input.amountUsdc ?? item.currentPriceUsdc).toFixed(6));
  const payment: Payment = {
    id: paymentId,
    sessionId: input.sessionId,
    itemId: input.itemId,
    kind: input.kind ?? "read",
    amountUsdc,
    paymentSignature: input.paymentSignature,
    settlementStatus: input.settlementStatus ?? "batched",
    gatewayTransferId: input.gatewayTransferId ?? makeId("gw"),
    explorerUrl: input.explorerUrl ?? arcExplorerTxUrl(txHash),
    createdAt: new Date().toISOString(),
    payer: input.payer,
    liveGatewayTx: input.liveGatewayTx,
  };

  const itemCollaborators = store.collaborators.filter(
    (collaborator) => collaborator.itemId === item.id,
  );
  const payoutSplits = itemCollaborators.map((collaborator) => {
    const splitHash = makeHash(`${paymentId}:${collaborator.creatorId}`);
    return {
      id: makeId("split"),
      paymentId,
      creatorId: collaborator.creatorId,
      amountUsdc: Number(((amountUsdc * collaborator.splitBps) / 10000).toFixed(6)),
      splitBps: collaborator.splitBps,
      txHash: splitHash,
      explorerUrl: `${ARC_EXPLORER_TX_BASE}/${splitHash}`,
    };
  });

  store.payments.unshift(payment);
  store.payoutSplits.unshift(...payoutSplits);

  return { payment, payoutSplits };
}
