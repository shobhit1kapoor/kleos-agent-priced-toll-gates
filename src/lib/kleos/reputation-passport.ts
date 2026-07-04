import { arcExplorerTxUrl, KLEOS_AGENT_WALLET } from "./config";
import { getLedgerSnapshot } from "./ledger";
import { getStore } from "./store";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function digest(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return `0x${Math.abs(hash).toString(16).padStart(64, "0").slice(0, 64)}`;
}

function evidenceHash(values: unknown[]) {
  return digest(JSON.stringify(values));
}

export function buildReputationPassport() {
  const ledger = getLedgerSnapshot();
  const buyerWallets = Array.from(new Set(ledger.sessions.map((session) => session.buyerWallet)));

  const buyerAgents = buyerWallets.map((wallet) => {
    const sessions = ledger.sessions.filter((session) => session.buyerWallet === wallet);
    const payments = ledger.payments.filter((payment) =>
      sessions.some((session) => session.id === payment.sessionId),
    );
    const citations = ledger.citationReceipts.filter((receipt) =>
      sessions.some((session) => session.id === receipt.sessionId),
    );
    const challenges = ledger.citationChallenges.filter((challenge) =>
      sessions.some((session) => session.id === challenge.sessionId),
    );
    const rejectedChallenges = challenges.filter((challenge) => challenge.status === "rejected").length;
    const acceptedChallenges = challenges.filter((challenge) => challenge.status === "accepted").length;
    const averageSessionReputation =
      sessions.reduce((sum, session) => sum + session.buyerReputation, 0) / Math.max(1, sessions.length);
    const score = clampScore(
      averageSessionReputation +
        payments.length * 1.5 +
        citations.length * 2 +
        rejectedChallenges * 1 -
        acceptedChallenges * 5,
    );

    return {
      subject: wallet,
      subjectType: "buyer-agent",
      score,
      tier: score >= 92 ? "trusted" : score >= 80 ? "standard" : "watchlist",
      discountBps: score >= 92 ? 800 : score >= 80 ? 400 : 0,
      evidence: {
        sessions: sessions.length,
        paidPayments: payments.length,
        citationReceipts: citations.length,
        acceptedChallenges,
        rejectedChallenges,
        proofHash: evidenceHash([wallet, sessions, payments, citations, challenges]),
      },
    };
  });

  const creators = ledger.creators.map((creator) => {
    const splits = ledger.payoutSplits.filter((split) => split.creatorId === creator.id);
    const impactGrants = ledger.impactGrants.filter((grant) => grant.creatorId === creator.id);
    const verifiedPublisher = ledger.publisherVerifications.some(
      (verification) =>
        verification.status === "verified" &&
        (verification.creatorId === creator.id ||
          verification.wallet.toLowerCase() === creator.wallet.toLowerCase()),
    );
    const sources = ledger.catalog.filter((item) =>
      item.collaborators.some((collaborator) => collaborator.id === creator.id),
    );
    const score = clampScore(
      creator.reputation +
        splits.length * 0.5 +
        impactGrants.length * 1.5 +
        sources.length * 0.5 +
        (verifiedPublisher ? 4 : 0),
    );

    return {
      subject: creator.wallet,
      subjectType: creator.role === "publisher" ? "publisher" : "creator",
      creatorId: creator.id,
      displayName: creator.displayName,
      score,
      tier: score >= 92 ? "verified-premium" : score >= 80 ? "verified-standard" : "unverified",
      verifiedPublisher,
      evidence: {
        sources: sources.length,
        splitRecords: splits.length,
        impactGrants: impactGrants.length,
        payoutUsdc: Number(splits.reduce((sum, split) => sum + split.amountUsdc, 0).toFixed(6)),
        proofHash: evidenceHash([creator, sources, splits, impactGrants, verifiedPublisher]),
      },
    };
  });

  const settlementAgentScore = clampScore(
    80 +
      (ledger.gatewayProof.liveX402Receipt.receiptId ? 8 : 0) +
      Math.min(5, ledger.metrics.validReceiptVerifications) +
      Math.min(5, ledger.metrics.answerSettlements) +
      Math.min(2, ledger.metrics.verifiedPublishers),
  );

  return {
    schema: "kleos.reputation.passport.v1",
    generatedAt: new Date().toISOString(),
    network: "Arc Testnet",
    erc8004Ready: {
      identityRegistry: "adapter-ready",
      reputationRegistry: "adapter-ready",
      validationRegistry: "adapter-ready",
      onchainRegistrationClaimed: false,
      note:
        "Kleos exports portable local reputation evidence without pretending ERC-8004 onchain registration is complete.",
    },
    settlementAgent: {
      subject: KLEOS_AGENT_WALLET,
      subjectType: "settlement-agent",
      score: settlementAgentScore,
      tier: settlementAgentScore >= 95 ? "operator-grade" : "submission-ready",
      evidence: {
        liveX402Receipt: ledger.gatewayProof.liveX402Receipt.receiptId,
        validReceiptVerifications: ledger.metrics.validReceiptVerifications,
        citationChallenges: ledger.metrics.citationChallenges,
        verifiedPublishers: ledger.metrics.verifiedPublishers,
        trustEvents: ledger.agentTrustEvents.length,
        proofHash: evidenceHash([
          ledger.gatewayProof.liveX402Receipt,
          ledger.receiptVerifications,
          ledger.citationChallenges,
          ledger.publisherVerifications,
        ]),
      },
    },
    buyerAgents,
    creators,
    agentTrustEvents: ledger.agentTrustEvents,
    scoringPolicy: {
      buyer:
        "Buyer score starts from session reputation, then rewards paid settlements and citations while penalizing accepted weak-citation challenges.",
      creator:
        "Creator score starts from local reputation, then rewards verified publisher ownership, split payouts, cited-source impact, and source inventory.",
      settlementAgent:
        "Settlement-agent score is backed by live x402 proof, receipt verification, challenge history, publisher verification, and trust events.",
    },
  };
}

export function createReputationAttestation(input: {
  subject: string;
  counterparty?: string;
  title?: string;
  note?: string;
  amountUsdc?: number;
}) {
  const store = getStore();
  const amountUsdc = Number(input.amountUsdc ?? 0);
  const digestValue = digest(
    `${input.subject}:${input.counterparty ?? KLEOS_AGENT_WALLET}:${input.title ?? "reputation-attestation"}:${input.note ?? ""}`,
  );
  const event = {
    id: `ate_${Date.now().toString(36)}_${digestValue.slice(2, 8)}`,
    title: input.title?.trim() || "Reputation passport attestation",
    network: "Arc Testnet" as const,
    status: "signed_bound" as const,
    amountUsdc,
    agent: input.subject.trim(),
    counterparty: input.counterparty?.trim() || KLEOS_AGENT_WALLET,
    contractAddress: "ReputationPassport-ready-local-index",
    digest: digestValue,
    txHash: digestValue,
    note:
      input.note?.trim() ||
      "Local reputation event exported through the Kleos ERC-8004-ready passport adapter.",
    createdAt: new Date().toISOString(),
  };

  store.agentTrustEvents.unshift(event);

  return {
    event: {
      ...event,
      explorerUrl: arcExplorerTxUrl(event.txHash),
    },
    passport: buildReputationPassport(),
  };
}
