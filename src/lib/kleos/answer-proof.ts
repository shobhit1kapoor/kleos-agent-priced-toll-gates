import { makeHash } from "./charon";
import { getLedgerSnapshot } from "./ledger";
import { getCatalogItems, getStore } from "./store";
import type { ClaimTrace } from "./types";

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function splitClaims(answer: string) {
  const claims = answer
    .split(/(?<=[.!?])\s+/)
    .map((claim) => claim.trim())
    .filter((claim) => claim.length > 28)
    .slice(0, 5);

  return claims.length > 0
    ? claims
    : [
        "Kleos paid sources to inspect evidence.",
        "Kleos paid citation tolls only for sources used in the answer.",
      ];
}

function overlapScore(claim: string, haystack: string) {
  const terms = claim
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 4);
  if (terms.length === 0) {
    return 0;
  }

  const text = haystack.toLowerCase();
  const matches = terms.filter((term) => text.includes(term)).length;
  return Math.round((matches / terms.length) * 100);
}

export function buildAnswerProof(settlementId?: string, origin?: string) {
  const store = getStore();
  const catalog = getCatalogItems();
  const ledger = getLedgerSnapshot();
  const settlement = settlementId
    ? store.answerSettlements.find((entry) => entry.id === settlementId)
    : store.answerSettlements[0];

  if (!settlement) {
    return {
      status: "ready",
      message: "Run the buyer agent and finalize citations to mint a shareable answer proof.",
      schema: {
        answerHash: "string",
        claimTraces: "covered/partial/unsupported claim support records",
        citationReceipts: "answer-linked receipt hashes and source spans",
        creatorPayouts: "split records tied to read/citation payments",
        webhookDeliveries: "signed creator notification payloads",
      },
      liveX402Receipt: ledger.gatewayProof.liveX402Receipt,
    };
  }

  const session = store.agentSessions.find((entry) => entry.id === settlement.sessionId);
  const receipts = store.citationReceipts.filter((receipt) => receipt.sessionId === settlement.sessionId);
  const payments = store.payments.filter((payment) => payment.sessionId === settlement.sessionId);
  const splits = store.payoutSplits.filter((split) =>
    payments.some((payment) => payment.id === split.paymentId),
  );
  const impactGrants = store.impactGrants.filter((grant) => grant.settlementId === settlement.id);
  const deliveries = store.webhookDeliveries.filter((delivery) =>
    receipts.some((receipt) =>
      store.collaborators.some(
        (collaborator) =>
          collaborator.itemId === receipt.itemId && collaborator.creatorId === delivery.creatorId,
      ),
    ),
  );

  const claimTraces = splitClaims(settlement.answer).map((claim): ClaimTrace => {
    const scoredReceipts = receipts
      .map((receipt) => {
        const item = catalog.find((entry) => entry.id === receipt.itemId);
        return {
          receipt,
          item,
          score: overlapScore(claim, `${receipt.claim} ${receipt.supportSpan} ${item?.fullContent ?? ""}`),
        };
      })
      .filter((entry) => entry.item && entry.score > 0)
      .sort((a, b) => b.score - a.score);
    const bestScore = scoredReceipts[0]?.score ?? 0;
    const receiptConfidence = scoredReceipts[0]?.receipt.confidence ?? 0;
    const coveragePct =
      scoredReceipts.length > 0
        ? Math.min(100, Math.max(Math.round(bestScore * 0.45 + receiptConfidence * 0.55), receiptConfidence - 4))
        : 0;
    const supportingReceipts = scoredReceipts.filter((entry) => entry.score >= Math.max(20, bestScore - 15));

    return {
      id: makeId("claim"),
      sessionId: settlement.sessionId,
      claim,
      coveragePct,
      status: coveragePct >= 72 ? "covered" : coveragePct >= 40 ? "partial" : "unsupported",
      supportingItemIds: supportingReceipts.map((entry) => entry.receipt.itemId),
      paidReadIds: payments
        .filter((payment) =>
          supportingReceipts.some((entry) => entry.receipt.readPaymentId === payment.id),
        )
        .map((payment) => payment.id),
      citationReceiptIds: supportingReceipts.map((entry) => entry.receipt.id),
      rationale:
        coveragePct >= 72
          ? "Claim is backed by a cited paid source and a citation receipt."
          : coveragePct >= 40
            ? "Claim has partial lexical/support overlap but should be reviewed before reuse."
            : "Claim was not strong enough to receive citation settlement.",
    };
  });

  store.claimTraces = [
    ...claimTraces,
    ...store.claimTraces.filter((trace) => trace.sessionId !== settlement.sessionId),
  ].slice(0, 50);

  const proofHash = makeHash(
    JSON.stringify({
      answerHash: settlement.answerHash,
      receiptHashes: receipts.map((receipt) => receipt.receiptHash),
      splitIds: splits.map((split) => split.id),
      impactIds: impactGrants.map((grant) => grant.id),
    }),
  );

  return {
    status: "minted",
    proofHash,
    shareUrl: origin ? `${origin}/api/answers/proof?settlementId=${settlement.id}` : null,
    settlement,
    session,
    claimTraces,
    citationReceipts: receipts,
    creatorPayouts: splits,
    impactGrants,
    webhookDeliveries: deliveries,
    liveX402Receipt: ledger.gatewayProof.liveX402Receipt,
    judgeSummary: {
      coveredClaims: claimTraces.filter((trace) => trace.status === "covered").length,
      partialClaims: claimTraces.filter((trace) => trace.status === "partial").length,
      unsupportedClaims: claimTraces.filter((trace) => trace.status === "unsupported").length,
      citedSources: settlement.citedItemIds.length,
      boughtButNotCited: settlement.skippedPurchasedItemIds.length,
      totalCreatorPayoutUsdc: Number(splits.reduce((sum, split) => sum + split.amountUsdc, 0).toFixed(6)),
      impactPoolUsdc: Number(impactGrants.reduce((sum, grant) => sum + grant.amountUsdc, 0).toFixed(6)),
    },
  };
}
