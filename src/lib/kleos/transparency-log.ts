import { makeHash } from "./charon";
import { getLedgerSnapshot } from "./ledger";

type TransparencyRecordType =
  | "payment"
  | "payout_split"
  | "citation_receipt"
  | "answer_settlement"
  | "impact_grant"
  | "creator_cashout"
  | "publisher_verification"
  | "agent_trust_event"
  | "agent_spend_permit"
  | "receipt_verification"
  | "citation_challenge";

type TransparencyPayload = Record<string, unknown>;

export type TransparencyEntry = {
  index: number;
  id: string;
  type: TransparencyRecordType;
  createdAt: string;
  amountUsdc: number | null;
  relatedIds: string[];
  payloadHash: string;
  leafHash: string;
};

export type TransparencyProofNode = {
  position: "left" | "right";
  hash: string;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }

  return value;
}

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

function entry(
  type: TransparencyRecordType,
  id: string,
  createdAt: string | undefined,
  amountUsdc: number | null,
  relatedIds: string[],
  payload: TransparencyPayload,
) {
  const payloadHash = makeHash(canonicalJson({ type, id, ...payload }));
  return {
    id,
    type,
    createdAt: createdAt ?? "unknown",
    amountUsdc,
    relatedIds,
    payloadHash,
  };
}

function parentHash(left: string, right: string) {
  return makeHash(`kleos-transparency-parent-v1:${left}:${right}`);
}

function leafHash(input: Omit<TransparencyEntry, "index" | "leafHash">) {
  return makeHash(`kleos-transparency-leaf-v1:${canonicalJson(input)}`);
}

function merkleLayers(leafHashes: string[]) {
  if (leafHashes.length === 0) {
    return [[makeHash("kleos-transparency-empty-root")]];
  }

  const layers = [leafHashes];
  let current = leafHashes;

  while (current.length > 1) {
    const next: string[] = [];
    for (let index = 0; index < current.length; index += 2) {
      const left = current[index];
      const right = current[index + 1] ?? left;
      next.push(parentHash(left, right));
    }
    layers.push(next);
    current = next;
  }

  return layers;
}

function proofForIndex(layers: string[][], index: number): TransparencyProofNode[] {
  const proof: TransparencyProofNode[] = [];
  let cursor = index;

  for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
    const layer = layers[layerIndex];
    const isRight = cursor % 2 === 1;
    const siblingIndex = isRight ? cursor - 1 : cursor + 1;
    const siblingHash = layer[siblingIndex] ?? layer[cursor];
    proof.push({
      position: isRight ? "left" : "right",
      hash: siblingHash,
    });
    cursor = Math.floor(cursor / 2);
  }

  return proof;
}

function computeRootFromProof(leaf: string, proof: TransparencyProofNode[]) {
  return proof.reduce(
    (current, node) =>
      node.position === "left" ? parentHash(node.hash, current) : parentHash(current, node.hash),
    leaf,
  );
}

function buildRawEntries() {
  const ledger = getLedgerSnapshot();

  return [
    ...ledger.payments.map((payment) =>
      entry("payment", payment.id, payment.createdAt, payment.amountUsdc, [payment.sessionId, payment.itemId], {
        sessionId: payment.sessionId,
        itemId: payment.itemId,
        kind: payment.kind,
        settlementStatus: payment.settlementStatus,
        gatewayTransferId: payment.gatewayTransferId,
        explorerUrl: payment.explorerUrl,
        payer: payment.payer,
        liveGatewayTx: payment.liveGatewayTx,
        paymentSignatureDigest: makeHash(payment.paymentSignature),
      }),
    ),
    ...ledger.payoutSplits.map((split) =>
      entry("payout_split", split.id, undefined, split.amountUsdc, [split.paymentId, split.creatorId], {
        paymentId: split.paymentId,
        creatorId: split.creatorId,
        splitBps: split.splitBps,
        txHash: split.txHash,
        explorerUrl: split.explorerUrl,
      }),
    ),
    ...ledger.citationReceipts.map((receipt) =>
      entry("citation_receipt", receipt.id, receipt.createdAt, receipt.amountUsdc, [
        receipt.sessionId,
        receipt.itemId,
        receipt.readPaymentId,
        receipt.citationPaymentId,
      ], {
        answerHash: receipt.answerHash,
        supportSpanDigest: makeHash(receipt.supportSpan),
        receiptHash: receipt.receiptHash,
        citationHash: receipt.citationHash,
        confidence: receipt.confidence,
        impactScore: receipt.impactScore,
        settlementStatus: receipt.settlementStatus,
      }),
    ),
    ...ledger.answerSettlements.map((settlement) =>
      entry("answer_settlement", settlement.id, settlement.createdAt, settlement.citationTollUsdc, [
        settlement.sessionId,
        ...settlement.citedItemIds,
      ], {
        answerHash: settlement.answerHash,
        answerDigest: makeHash(settlement.answer),
        readTollUsdc: settlement.readTollUsdc,
        skippedPurchasedItemIds: settlement.skippedPurchasedItemIds,
        remainingBudgetUsdc: settlement.remainingBudgetUsdc,
        brokerBondUsdc: settlement.brokerBondUsdc,
        bondStatus: settlement.bondStatus,
        receiptHash: settlement.receiptHash,
      }),
    ),
    ...ledger.impactGrants.map((grant) =>
      entry("impact_grant", grant.id, grant.createdAt, grant.amountUsdc, [
        grant.settlementId,
        grant.receiptId,
        grant.itemId,
        grant.creatorId,
      ], {
        sourceTitle: grant.sourceTitle,
        impactScore: grant.impactScore,
        reasonDigest: makeHash(grant.reason),
        txHash: grant.txHash,
        explorerUrl: grant.explorerUrl,
      }),
    ),
    ...ledger.creatorCashouts.map((cashout) =>
      entry("creator_cashout", cashout.id, cashout.createdAt, cashout.amountUsdc, [cashout.creatorId], {
        sourceCount: cashout.sourceCount,
        status: cashout.status,
        txHash: cashout.txHash,
        explorerUrl: cashout.explorerUrl,
      }),
    ),
    ...ledger.publisherVerifications.map((verification) =>
      entry("publisher_verification", verification.id, verification.createdAt, null, [
        verification.creatorId,
      ], {
        creatorName: verification.creatorName,
        wallet: verification.wallet,
        publisherUrl: verification.publisherUrl,
        feedUrl: verification.feedUrl,
        method: verification.method,
        challengeDigest: makeHash(verification.challenge),
        proofUrl: verification.proofUrl,
        proofDigest: verification.proofDigest,
        status: verification.status,
        checkedAt: verification.checkedAt,
      }),
    ),
    ...ledger.agentTrustEvents.map((event) =>
      entry("agent_trust_event", event.id, event.createdAt, event.amountUsdc, [
        event.agent,
        event.counterparty,
      ], {
        title: event.title,
        status: event.status,
        network: event.network,
        contractAddress: event.contractAddress,
        digest: event.digest,
        txHash: event.txHash,
        noteDigest: makeHash(event.note),
      }),
    ),
    ...ledger.agentSpendPermits.map((permit) =>
      entry("agent_spend_permit", permit.id, permit.issuedAt, permit.budgetUsdc, [
        permit.agentName,
      ], {
        purposeDigest: makeHash(permit.purpose),
        operatorDigest: permit.operatorContact ? makeHash(permit.operatorContact) : null,
        maxTollUsdc: permit.maxTollUsdc,
        spentUsdc: permit.spentUsdc,
        remainingUsdc: permit.remainingUsdc,
        allowedTools: permit.allowedTools,
        allowedEndpoints: permit.allowedEndpoints,
        status: permit.status,
        expiresAt: permit.expiresAt,
        permitHash: permit.permitHash,
        policyDigest: permit.policyDigest,
      }),
    ),
    ...ledger.receiptVerifications.map((verification) =>
      entry("receipt_verification", verification.id, verification.createdAt, null, [
        verification.targetId,
      ], {
        targetType: verification.targetType,
        status: verification.status,
        proofHash: verification.proofHash,
        checkDigest: makeHash(canonicalJson(verification.checks)),
      }),
    ),
    ...ledger.citationChallenges.map((challenge) =>
      entry("citation_challenge", challenge.id, challenge.createdAt, challenge.bondImpactUsdc, [
        challenge.receiptId,
        challenge.sessionId,
        challenge.itemId,
      ], {
        challengerDigest: makeHash(challenge.challenger),
        claimedWeakness: challenge.claimedWeakness,
        status: challenge.status,
        buyerReputationDelta: challenge.buyerReputationDelta,
        evaluatorRationaleDigest: makeHash(challenge.evaluatorRationale),
        proofHash: challenge.proofHash,
      }),
    ),
  ].sort((left, right) => {
    const time = left.createdAt.localeCompare(right.createdAt);
    return time === 0 ? left.id.localeCompare(right.id) : time;
  });
}

export function buildTransparencyLog() {
  const rawEntries = buildRawEntries();
  const entries: TransparencyEntry[] = rawEntries.map((raw, index) => {
    const indexed = { ...raw, index };
    return {
      ...indexed,
      leafHash: leafHash(indexed),
    };
  });
  const layers = merkleLayers(entries.map((item) => item.leafHash));
  const rootHash = layers.at(-1)?.[0] ?? makeHash("kleos-transparency-empty-root");
  const sampleProofs = entries.slice(0, 3).map((item) => {
    const proof = proofForIndex(layers, item.index);
    const recomputedRoot = computeRootFromProof(item.leafHash, proof);
    return {
      entryId: item.id,
      leafHash: item.leafHash,
      proof,
      recomputedRoot,
      verified: recomputedRoot === rootHash,
    };
  });
  const totals = entries.reduce(
    (accumulator, item) => {
      accumulator[item.type] = (accumulator[item.type] ?? 0) + 1;
      if (item.amountUsdc) {
        accumulator.amountUsdc = Number((accumulator.amountUsdc + item.amountUsdc).toFixed(6));
      }
      return accumulator;
    },
    { amountUsdc: 0 } as Record<string, number>,
  );

  return {
    schema: "kleos.transparency.v1",
    generatedAt: new Date().toISOString(),
    rootHash,
    entryCount: entries.length,
    leafAlgorithm: "makeHash(kleos-transparency-leaf-v1:canonical-json(entry))",
    parentAlgorithm: "makeHash(kleos-transparency-parent-v1:left:right)",
    totals,
    sampleProofs,
    entries,
  };
}

export function buildTransparencyProof(id: string) {
  const log = buildTransparencyLog();
  const entry = log.entries.find((item) => item.id === id);

  if (!entry) {
    return null;
  }

  const layers = merkleLayers(log.entries.map((item) => item.leafHash));
  const proof = proofForIndex(layers, entry.index);
  const recomputedRoot = computeRootFromProof(entry.leafHash, proof);

  return {
    schema: "kleos.transparency.proof.v1",
    generatedAt: new Date().toISOString(),
    rootHash: log.rootHash,
    entry,
    proof,
    recomputedRoot,
    verified: recomputedRoot === log.rootHash,
  };
}
