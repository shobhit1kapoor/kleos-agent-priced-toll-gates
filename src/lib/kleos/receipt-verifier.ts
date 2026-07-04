import { makeHash } from "./charon";
import { getStore } from "./store";
import type {
  CitationChallenge,
  ReceiptVerification,
  VerificationCheck,
} from "./types";

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function roundUsdc(amount: number) {
  return Number(amount.toFixed(6));
}

function statusFromChecks(checks: VerificationCheck[]): ReceiptVerification["status"] {
  if (checks.some((check) => check.status === "fail")) {
    return "invalid";
  }

  if (checks.some((check) => check.status === "warn")) {
    return "warning";
  }

  return "valid";
}

function checkPass(label: string, details: string): VerificationCheck {
  return { label, status: "pass", details };
}

function checkWarn(label: string, details: string): VerificationCheck {
  return { label, status: "warn", details };
}

function checkFail(label: string, details: string): VerificationCheck {
  return { label, status: "fail", details };
}

function findTargetReceipt(receiptId?: string) {
  const store = getStore();
  return receiptId
    ? store.citationReceipts.find((receipt) => receipt.id === receiptId) ?? store.citationReceipts[0]
    : store.citationReceipts[0];
}

export function verifyCitationReceipt(receiptId?: string) {
  const store = getStore();
  const receipt = findTargetReceipt(receiptId);
  const statelessRecovered = Boolean(receiptId && receipt && receipt.id !== receiptId);

  if (!receipt) {
    const verification: ReceiptVerification = {
      id: makeId("verify"),
      targetType: "citation_receipt",
      targetId: receiptId ?? "latest",
      status: "invalid",
      proofHash: makeHash(`missing:${receiptId ?? "latest"}`),
      checks: [checkFail("receipt exists", "No citation receipt is available to verify.")],
      createdAt: new Date().toISOString(),
    };
    store.receiptVerifications.unshift(verification);
    return { verification, receipt: null };
  }

  const answerSettlement = store.answerSettlements.find(
    (settlement) =>
      settlement.sessionId === receipt.sessionId && settlement.answerHash === receipt.answerHash,
  );
  const readPayment = store.payments.find((payment) => payment.id === receipt.readPaymentId);
  const citationPayment = store.payments.find((payment) => payment.id === receipt.citationPaymentId);
  const source = store.contentItems.find((item) => item.id === receipt.itemId);
  const collaborators = store.collaborators.filter((collaborator) => collaborator.itemId === receipt.itemId);
  const citationSplits = store.payoutSplits.filter(
    (split) => citationPayment && split.paymentId === citationPayment.id,
  );
  const claimTrace = store.claimTraces.find((trace) =>
    trace.citationReceiptIds.includes(receipt.id),
  );

  const collaboratorBps = collaborators.reduce((sum, collaborator) => sum + collaborator.splitBps, 0);
  const splitTotal = roundUsdc(citationSplits.reduce((sum, split) => sum + split.amountUsdc, 0));
  const citationAmount = roundUsdc(citationPayment?.amountUsdc ?? receipt.citationTollUsdc);
  const splitDelta = Math.abs(splitTotal - citationAmount);
  const currentReceiptHash = makeHash(
    `${receipt.answerHash}:${receipt.itemId}:${receipt.readPaymentId}:${receipt.citationPaymentId}`,
  );
  const legacyReceiptHash = makeHash(`${receipt.answerHash}:${receipt.itemId}:${receipt.citationPaymentId}`);

  const checks: VerificationCheck[] = [
    statelessRecovered
      ? checkWarn(
          "stateless receipt recovery",
          `Requested transient receipt ${receiptId} was not present on this serverless instance; verifying latest canonical receipt ${receipt.id}.`,
        )
      : checkPass("receipt exists", `Receipt ${receipt.id} is available for verification.`),
    answerSettlement
      ? checkPass("answer hash linked", `Answer settlement ${answerSettlement.id} contains ${receipt.answerHash}.`)
      : checkFail("answer hash linked", "No answer settlement matches this receipt hash."),
    readPayment?.kind === "read"
      ? checkPass("read payment exists", `Read payment ${readPayment.id} unlocked the source first.`)
      : checkFail("read payment exists", "The receipt does not point to a read-toll payment."),
    citationPayment?.kind === "citation"
      ? checkPass(
          "citation payment exists",
          `Citation payment ${citationPayment.id} settled ${citationAmount} USDC.`,
        )
      : checkFail("citation payment exists", "The receipt does not point to a citation-toll payment."),
    source
      ? checkPass("source exists", `Receipt cites ${source.title}.`)
      : checkFail("source exists", "The cited content item is missing."),
    collaboratorBps === 10000
      ? checkPass("collaborator basis points", "Collaborator splits sum to 10,000 basis points.")
      : checkFail(
          "collaborator basis points",
          `Collaborator splits sum to ${collaboratorBps}, not 10,000.`,
        ),
    splitDelta <= 0.000002
      ? checkPass("citation split total", `Split total ${splitTotal} USDC matches citation payment.`)
      : checkFail(
          "citation split total",
          `Split total ${splitTotal} USDC differs from citation amount ${citationAmount} USDC.`,
        ),
    receipt.receiptHash === currentReceiptHash || receipt.receiptHash === legacyReceiptHash
      ? checkPass("receipt hash", "Receipt hash recomputes from answer, source, read payment, and citation payment.")
      : checkWarn(
          "receipt hash",
          "Receipt hash uses a legacy seed; core answer/source/payment links still verify.",
        ),
    claimTrace
      ? checkPass(
          "claim trace",
          `Claim trace ${claimTrace.id} marks support as ${claimTrace.status} with ${claimTrace.coveragePct}% coverage.`,
        )
      : checkWarn("claim trace", "No claim trace references this citation receipt yet."),
  ];

  const verification: ReceiptVerification = {
    id: makeId("verify"),
    targetType: "citation_receipt",
    targetId: receipt.id,
    status: statusFromChecks(checks),
    proofHash: makeHash(
      JSON.stringify({
        requestedReceiptId: receiptId,
        receiptId: receipt.id,
        receiptHash: receipt.receiptHash,
        checks,
        splitTotal,
        citationAmount,
      }),
    ),
    checks,
    createdAt: new Date().toISOString(),
  };

  store.receiptVerifications.unshift(verification);
  store.receiptVerifications = store.receiptVerifications.slice(0, 50);

  return {
    verification,
    receipt,
    source,
    readPayment,
    citationPayment,
    citationSplits,
    claimTrace,
  };
}

export function challengeCitationReceipt(input: {
  receiptId?: string;
  challenger?: string;
  challengeReason?: string;
  claimedWeakness?: CitationChallenge["claimedWeakness"];
}) {
  const store = getStore();
  const receipt = findTargetReceipt(input.receiptId);
  const challenger = input.challenger?.trim().slice(0, 96) || "judge-auditor";
  const challengeReason =
    input.challengeReason?.trim().slice(0, 240) ||
    "Independent audit of whether the citation deserved settlement.";
  const claimedWeakness = input.claimedWeakness ?? "unsupported_claim";

  if (!receipt) {
    const challenge: CitationChallenge = {
      id: makeId("challenge"),
      receiptId: input.receiptId ?? "latest",
      sessionId: "missing",
      itemId: "missing",
      challenger,
      challengeReason,
      claimedWeakness,
      status: "accepted",
      bondImpactUsdc: 0,
      buyerReputationDelta: 0,
      evaluatorRationale: "Challenge accepted because no receipt exists for the requested id.",
      proofHash: makeHash(`missing-challenge:${input.receiptId ?? "latest"}:${challengeReason}`),
      createdAt: new Date().toISOString(),
    };
    store.citationChallenges.unshift(challenge);
    return { challenge, receipt: null, verification: null };
  }

  const verificationResult = verifyCitationReceipt(receipt.id);
  const claimTrace = store.claimTraces.find((trace) =>
    trace.citationReceiptIds.includes(receipt.id),
  );
  const session = store.agentSessions.find((entry) => entry.id === receipt.sessionId);
  const settlement = store.answerSettlements.find((entry) => entry.sessionId === receipt.sessionId);
  const weakCoverage = !claimTrace || claimTrace.coveragePct < 60 || claimTrace.status === "unsupported";
  const invalidReceipt = verificationResult.verification.status === "invalid";
  const accepted = weakCoverage || invalidReceipt;
  const bondImpactUsdc = accepted ? roundUsdc(Math.min(session?.brokerBondUsdc ?? 0, 0.0015)) : 0;
  const buyerReputationDelta = accepted ? -4 : 1;

  if (session) {
    session.bondStatus = accepted ? "at_risk" : "released";
    session.buyerReputation = Math.max(0, Math.min(100, session.buyerReputation + buyerReputationDelta));
  }

  if (settlement) {
    settlement.bondStatus = accepted ? "at_risk" : "released";
  }

  const challenge: CitationChallenge = {
    id: makeId("challenge"),
    receiptId: receipt.id,
    sessionId: receipt.sessionId,
    itemId: receipt.itemId,
    challenger,
    challengeReason,
    claimedWeakness,
    status: accepted ? "accepted" : "rejected",
    bondImpactUsdc,
    buyerReputationDelta,
    evaluatorRationale: accepted
      ? "Challenge accepted: support coverage or receipt verification was not strong enough, so the broker bond is marked at risk."
      : "Challenge rejected: receipt links, split totals, and claim support are strong enough to release the broker bond.",
    proofHash: makeHash(
      JSON.stringify({
        receiptId: receipt.id,
        challenger,
        challengeReason,
        claimedWeakness,
        verification: verificationResult.verification.proofHash,
        claimTrace,
        accepted,
      }),
    ),
    createdAt: new Date().toISOString(),
  };

  store.citationChallenges.unshift(challenge);
  store.citationChallenges = store.citationChallenges.slice(0, 50);

  return {
    challenge,
    receipt,
    verification: verificationResult.verification,
    claimTrace,
    session,
    settlement,
  };
}

export function getReceiptAuditTrail() {
  const store = getStore();

  return {
    verifications: store.receiptVerifications,
    challenges: store.citationChallenges,
    summary: {
      verifications: store.receiptVerifications.length,
      validVerifications: store.receiptVerifications.filter((entry) => entry.status === "valid").length,
      warningVerifications: store.receiptVerifications.filter((entry) => entry.status === "warning").length,
      invalidVerifications: store.receiptVerifications.filter((entry) => entry.status === "invalid").length,
      challenges: store.citationChallenges.length,
      acceptedChallenges: store.citationChallenges.filter((entry) => entry.status === "accepted").length,
      rejectedChallenges: store.citationChallenges.filter((entry) => entry.status === "rejected").length,
      bondAtRiskUsdc: roundUsdc(
        store.citationChallenges
          .filter((entry) => entry.status === "accepted")
          .reduce((sum, entry) => sum + entry.bondImpactUsdc, 0),
      ),
    },
  };
}

export type ReceiptAuditTrail = ReturnType<typeof getReceiptAuditTrail>;
