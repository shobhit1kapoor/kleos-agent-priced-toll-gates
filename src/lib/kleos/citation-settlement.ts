import { createPaymentProof, makeHash, settlePayment } from "./charon";
import { KLEOS_AGENT_WALLET } from "./config";
import { recomputePrices } from "./pricing";
import { getCatalogItems, getStore } from "./store";
import type { AnswerSettlement, CitationReceipt, Payment } from "./types";

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function citationTollUsdc(priceUsdc: number, configured?: number) {
  return Number(Math.max(0.000001, configured ?? priceUsdc * 0.35).toFixed(6));
}

function confidenceFor(item: ReturnType<typeof getCatalogItems>[number], answer: string) {
  const answerTerms = answer
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((term) => term.length > 3);
  const haystack = `${item.title} ${item.preview} ${item.fullContent} ${item.tags.join(" ")}`.toLowerCase();
  const matches = answerTerms.filter((term) => haystack.includes(term)).length;
  return Math.min(98, Math.round(item.credibilityScore * 0.55 + item.freshnessScore * 0.3 + matches * 4));
}

function supportSpanFor(item: ReturnType<typeof getCatalogItems>[number]) {
  const firstSentence = item.fullContent.split(". ").find(Boolean) ?? item.preview;
  return firstSentence.length > 220 ? `${firstSentence.slice(0, 217)}...` : firstSentence;
}

function claimFor(item: ReturnType<typeof getCatalogItems>[number]) {
  if (item.tags.includes("gateway")) {
    return "Gateway batching makes sub-cent agent citation payments economically viable.";
  }

  if (item.tags.includes("x402")) {
    return "x402 turns a paid source request into an HTTP-native payment negotiation.";
  }

  if (item.tags.includes("rsshub") || item.tags.includes("rss")) {
    return "RSS-like feeds give Kleos a practical ingestion path for creator content.";
  }

  if (item.tags.includes("distribution")) {
    return "Creator payment products win by attaching to audiences that already exist.";
  }

  if (item.tags.includes("erc-8004")) {
    return "Agent reputation can affect trust, access rules, and citation toll discounts.";
  }

  return `${item.title} materially supports the finalized answer.`;
}

export function finalizeAnswerCitations(input: {
  sessionId: string;
  answer?: string;
  maxCitationSpendUsdc?: number;
}) {
  const store = getStore();
  const session = store.agentSessions.find((entry) => entry.id === input.sessionId);
  if (!session) {
    throw new Error(`Unknown buyer-agent session: ${input.sessionId}`);
  }

  const existing = store.answerSettlements.find((entry) => entry.sessionId === session.id);
  if (existing) {
    return {
      settlement: existing,
      citationReceipts: store.citationReceipts.filter((receipt) => receipt.sessionId === session.id),
      citationPayments: store.payments.filter(
        (payment) => payment.sessionId === session.id && payment.kind === "citation",
      ),
      payoutSplits: store.payoutSplits.filter((split) =>
        store.payments.some((payment) => payment.id === split.paymentId && payment.sessionId === session.id),
      ),
      pricingEvents: [],
    };
  }

  const answer =
    input.answer?.trim() ||
    session.result ||
    "Kleos settles grounded AI answers by charging buyer agents to inspect creator sources, charging citation tolls only when those sources appear in the final answer, and splitting each toll to collaborators.";
  const answerHash = makeHash(`${session.id}:${answer}`);
  const readPayments = store.payments.filter(
    (payment) => payment.sessionId === session.id && payment.kind === "read",
  );
  const catalog = getCatalogItems();
  const purchased = readPayments
    .map((payment) => ({
      payment,
      item: catalog.find((entry) => entry.id === payment.itemId),
    }))
    .filter((entry): entry is { payment: Payment; item: NonNullable<typeof entry.item> } =>
      Boolean(entry.item),
    );

  const maxSpend =
    input.maxCitationSpendUsdc ??
    Math.max(0, Number((session.budgetUsdc - session.spentUsdc).toFixed(6)));
  let spentCitationUsdc = 0;
  const receipts: CitationReceipt[] = [];
  const citationPayments: Payment[] = [];
  const citedItemIds: string[] = [];
  const payoutSplitIds: string[] = [];

  const candidates = purchased
    .map((entry) => ({
      ...entry,
      confidence: confidenceFor(entry.item, answer),
      toll: citationTollUsdc(entry.item.currentPriceUsdc, entry.item.citationPriceUsdc),
    }))
    .filter((entry) => entry.confidence >= 72)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);

  for (const candidate of candidates) {
    if (Number((spentCitationUsdc + candidate.toll).toFixed(6)) > maxSpend) {
      continue;
    }

    const citationPayment = settlePayment({
      itemId: candidate.item.id,
      sessionId: session.id,
      paymentSignature: createPaymentProof(candidate.item.id, session.buyerWallet || KLEOS_AGENT_WALLET),
      kind: "citation",
      amountUsdc: candidate.toll,
      settlementStatus: "batched",
    });
    const receiptHash = makeHash(
      `${answerHash}:${candidate.item.id}:${candidate.payment.id}:${citationPayment.payment.id}`,
    );
    const receipt: CitationReceipt = {
      id: makeId("cite"),
      sessionId: session.id,
      itemId: candidate.item.id,
      answerHash,
      supportSpan: supportSpanFor(candidate.item),
      readPaymentId: candidate.payment.id,
      citationPaymentId: citationPayment.payment.id,
      paymentId: citationPayment.payment.id,
      citationHash: makeHash(`${answerHash}:${candidate.item.id}:${candidate.item.fullContent}`),
      receiptHash,
      claim: claimFor(candidate.item),
      confidence: candidate.confidence,
      impactScore: Math.min(100, Math.round(candidate.confidence * 0.72 + candidate.item.credibilityScore * 0.28)),
      citationTollUsdc: candidate.toll,
      amountUsdc: candidate.toll,
      settlementStatus: citationPayment.payment.settlementStatus,
      createdAt: new Date().toISOString(),
    };

    store.citationReceipts.unshift(receipt);
    receipts.push(receipt);
    citationPayments.push(citationPayment.payment);
    payoutSplitIds.push(...citationPayment.payoutSplits.map((split) => split.id));
    citedItemIds.push(candidate.item.id);
    spentCitationUsdc = Number((spentCitationUsdc + candidate.toll).toFixed(6));
  }

  const skippedPurchasedItemIds = purchased
    .map((entry) => entry.item.id)
    .filter((itemId) => !citedItemIds.includes(itemId));
  const readTollUsdc = Number(readPayments.reduce((sum, payment) => sum + payment.amountUsdc, 0).toFixed(6));
  const brokerBondUsdc = receipts.length > 0 ? 0.0025 : 0;
  const settlement: AnswerSettlement = {
    id: makeId("ans"),
    sessionId: session.id,
    answer,
    answerHash,
    readTollUsdc,
    citationTollUsdc: spentCitationUsdc,
    citedItemIds,
    skippedPurchasedItemIds,
    remainingBudgetUsdc: Number((session.budgetUsdc - session.spentUsdc - spentCitationUsdc).toFixed(6)),
    brokerBondUsdc,
    bondStatus: receipts.length > 0 ? "posted" : "at_risk",
    receiptHash: makeHash(`${answerHash}:${citedItemIds.join(":")}:${spentCitationUsdc}`),
    createdAt: new Date().toISOString(),
  };

  session.spentUsdc = Number((session.spentUsdc + spentCitationUsdc).toFixed(6));
  session.answerHash = answerHash;
  session.citationFinalizedAt = settlement.createdAt;
  session.brokerBondUsdc = brokerBondUsdc;
  session.bondStatus = settlement.bondStatus;
  session.result =
    receipts.length > 0
      ? `${answer} Kleos finalized ${receipts.length} citation receipt${
          receipts.length === 1 ? "" : "s"
        }, charged ${spentCitationUsdc.toFixed(4)} USDC in citation tolls, and left ${
          skippedPurchasedItemIds.length
        } purchased source${skippedPurchasedItemIds.length === 1 ? "" : "s"} uncited.`
      : `${answer} No citation toll was charged because no purchased source cleared the confidence threshold.`;
  store.answerSettlements.unshift(settlement);

  store.agentTrustEvents.unshift({
    id: makeId("ate"),
    title: "Bonded citation broker",
    network: "Arc Testnet",
    status: "signed_bound",
    amountUsdc: brokerBondUsdc,
    agent: session.buyerWallet || KLEOS_AGENT_WALLET,
    counterparty: "kleos://citation-settlement",
    contractAddress: "ERC-8004-ready-local-broker",
    digest: settlement.receiptHash,
    note:
      receipts.length > 0
        ? "Evaluator agent posted a local citation bond behind the finalized answer; weak citations can mark the bond at risk and lower buyer reputation."
        : "Evaluator agent withheld citation settlement because purchased evidence was not strong enough to bond.",
    createdAt: settlement.createdAt,
  });

  const pricingEvents = recomputePrices();
  const payoutSplits = store.payoutSplits.filter((split) => payoutSplitIds.includes(split.id));

  return {
    settlement,
    citationReceipts: receipts,
    citationPayments,
    payoutSplits,
    pricingEvents,
  };
}
