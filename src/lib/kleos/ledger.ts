import {
  arcExplorerTxUrl,
  GATEWAY_APPROVAL_TX,
  GATEWAY_BALANCE_USDC,
  GATEWAY_DEPOSIT_TX,
  LIVE_X402_AMOUNT_USDC,
  LIVE_X402_PAYER,
  LIVE_X402_RECEIPT_ID,
  KLEOS_AGENT_WALLET,
} from "./config";
import { estimatedRubricReadiness, rubricScorecard } from "./scorecard";
import { getCatalogItems, getStore } from "./store";

export function getLedgerSnapshot() {
  const store = getStore();
  const catalog = getCatalogItems();
  const totalUsdcMoved = store.payments.reduce((sum, payment) => sum + payment.amountUsdc, 0);
  const readTollUsdc = store.payments
    .filter((payment) => payment.kind === "read")
    .reduce((sum, payment) => sum + payment.amountUsdc, 0);
  const citationTollUsdc = store.payments
    .filter((payment) => payment.kind === "citation")
    .reduce((sum, payment) => sum + payment.amountUsdc, 0);
  const paidAccesses = store.purchaseAttempts.filter((attempt) => attempt.decision === "paid").length;
  const uniqueBuyerSessions = new Set(store.agentSessions.map((session) => session.id)).size;
  const creatorIdsPaid = new Set(store.payoutSplits.map((split) => split.creatorId)).size;
  const registeredSources = store.contentItems.filter((item) =>
    item.tags.includes("registered-source"),
  ).length;
  const impactPoolUsdc = store.impactGrants.reduce((sum, grant) => sum + grant.amountUsdc, 0);
  const sourcesWithImpactGrants = new Set(store.impactGrants.map((grant) => grant.itemId)).size;

  return {
    metrics: {
      creatorsOnboarded: store.creators.length,
      creatorIdsPaid,
      buyerAgentRuns: uniqueBuyerSessions,
      paidAccesses,
      totalPayments: store.payments.length,
      totalUsdcMoved: Number(totalUsdcMoved.toFixed(6)),
      averageToll:
        store.payments.length > 0
          ? Number((totalUsdcMoved / store.payments.length).toFixed(6))
          : 0,
      citationReceipts: store.citationReceipts.length,
      answerSettlements: store.answerSettlements.length,
      readTollUsdc: Number(readTollUsdc.toFixed(6)),
      citationTollUsdc: Number(citationTollUsdc.toFixed(6)),
      purchasedButNotCited: store.payments.filter(
        (payment) =>
          payment.kind === "read" &&
          !store.citationReceipts.some((receipt) => receipt.readPaymentId === payment.id),
      ).length,
      citationConversionPct:
        store.payments.filter((payment) => payment.kind === "read").length > 0
          ? Math.round(
              (store.citationReceipts.length /
                store.payments.filter((payment) => payment.kind === "read").length) *
                100,
            )
          : 0,
      registeredSources,
      agentTrustProofs: store.agentTrustEvents.length,
      impactGrants: store.impactGrants.length,
      impactPoolUsdc: Number(impactPoolUsdc.toFixed(6)),
      sourcesWithImpactGrants,
      claimTraces: store.claimTraces.length,
      creatorWebhooks: store.creatorWebhooks.length,
      webhookDeliveries: store.webhookDeliveries.length,
      creatorCashouts: store.creatorCashouts.length,
      verifiedPublishers: store.publisherVerifications.filter((entry) => entry.status === "verified").length,
      creatorCashoutUsdc: Number(
        store.creatorCashouts.reduce((sum, cashout) => sum + cashout.amountUsdc, 0).toFixed(6),
      ),
      testerAttestations: store.testerAttestations.length,
      scenarioRunsAttested: store.testerAttestations.filter((entry) => entry.scenarioRun).length,
      receiptVerifications: store.receiptVerifications.length,
      validReceiptVerifications: store.receiptVerifications.filter((entry) => entry.status === "valid")
        .length,
      citationChallenges: store.citationChallenges.length,
      rejectedCitationChallenges: store.citationChallenges.filter((entry) => entry.status === "rejected")
        .length,
      bondAtRiskUsdc: Number(
        store.citationChallenges
          .filter((entry) => entry.status === "accepted")
          .reduce((sum, challenge) => sum + challenge.bondImpactUsdc, 0)
          .toFixed(6),
      ),
    },
    gatewayProof: {
      network: "Arc Testnet",
      agentWallet: KLEOS_AGENT_WALLET,
      fundedBalanceUsdc: GATEWAY_BALANCE_USDC,
      approvalTx: GATEWAY_APPROVAL_TX,
      approvalExplorerUrl: arcExplorerTxUrl(GATEWAY_APPROVAL_TX),
      depositTx: GATEWAY_DEPOSIT_TX,
      depositExplorerUrl: arcExplorerTxUrl(GATEWAY_DEPOSIT_TX),
      liveX402Receipt: {
        receiptId: LIVE_X402_RECEIPT_ID,
        payer: LIVE_X402_PAYER,
        amountUsdc: LIVE_X402_AMOUNT_USDC,
        scheme: "GatewayWalletBatched",
      },
    },
    catalog,
    creators: store.creators,
    sessions: store.agentSessions,
    pricingEvents: store.pricingEvents,
    purchaseAttempts: store.purchaseAttempts,
    payments: store.payments,
    payoutSplits: store.payoutSplits,
    citationReceipts: store.citationReceipts,
    answerSettlements: store.answerSettlements,
    agentTrustEvents: store.agentTrustEvents,
    impactGrants: store.impactGrants,
    claimTraces: store.claimTraces,
    creatorWebhooks: store.creatorWebhooks,
    webhookDeliveries: store.webhookDeliveries,
    creatorCashouts: store.creatorCashouts,
    publisherVerifications: store.publisherVerifications,
    testerAttestations: store.testerAttestations,
    receiptVerifications: store.receiptVerifications,
    citationChallenges: store.citationChallenges,
    rubric: {
      readiness: estimatedRubricReadiness(),
      scorecard: rubricScorecard,
    },
  };
}

export type LedgerSnapshot = ReturnType<typeof getLedgerSnapshot>;
