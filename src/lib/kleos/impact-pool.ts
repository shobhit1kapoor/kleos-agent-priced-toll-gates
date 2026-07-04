import { arcExplorerTxUrl } from "./config";
import { getStore } from "./store";
import type { ImpactGrant } from "./types";

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeHash(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return `0x${Math.abs(hash).toString(16).padStart(64, "0").slice(0, 64)}`;
}

function roundUsdc(value: number) {
  return Number(value.toFixed(6));
}

export function settleImpactPool(input?: {
  settlementId?: string;
  sponsorPoolUsdc?: number;
}) {
  const store = getStore();
  const settlement =
    store.answerSettlements.find((entry) => entry.id === input?.settlementId) ??
    store.answerSettlements[0];

  if (!settlement) {
    throw new Error("Run and finalize an answer before settling the impact pool.");
  }

  const existing = store.impactGrants.filter((grant) => grant.settlementId === settlement.id);
  if (existing.length > 0) {
    return {
      settlement,
      impactGrants: existing,
      sponsorPoolUsdc: roundUsdc(existing.reduce((sum, grant) => sum + grant.amountUsdc, 0)),
      reused: true,
    };
  }

  const sponsorPoolUsdc = roundUsdc(input?.sponsorPoolUsdc ?? 0.012);
  const receipts = store.citationReceipts.filter((receipt) => receipt.sessionId === settlement.sessionId);
  if (receipts.length === 0) {
    throw new Error("No citation receipts are available for impact settlement.");
  }

  const totalWeight = receipts.reduce(
    (sum, receipt) => sum + Math.max(1, receipt.impactScore) * Math.max(1, receipt.confidence),
    0,
  );
  const now = new Date().toISOString();
  const grants: ImpactGrant[] = [];

  for (const receipt of receipts) {
    const item = store.contentItems.find((entry) => entry.id === receipt.itemId);
    const collaborators = store.collaborators.filter(
      (collaborator) => collaborator.itemId === receipt.itemId,
    );

    if (!item || collaborators.length === 0) {
      continue;
    }

    const receiptWeight = Math.max(1, receipt.impactScore) * Math.max(1, receipt.confidence);
    const receiptPool = roundUsdc((sponsorPoolUsdc * receiptWeight) / totalWeight);

    for (const collaborator of collaborators) {
      const creator = store.creators.find((entry) => entry.id === collaborator.creatorId);
      if (!creator) {
        continue;
      }

      const amountUsdc = roundUsdc((receiptPool * collaborator.splitBps) / 10000);
      if (amountUsdc <= 0) {
        continue;
      }

      const txHash = makeHash(
        `${settlement.id}:${receipt.id}:${collaborator.creatorId}:${amountUsdc}`,
      );

      grants.push({
        id: makeId("impact"),
        settlementId: settlement.id,
        receiptId: receipt.id,
        itemId: receipt.itemId,
        creatorId: collaborator.creatorId,
        sourceTitle: item.title,
        amountUsdc,
        impactScore: receipt.impactScore,
        reason: `Retroactive sponsor bonus because "${item.title}" was cited with ${receipt.confidence}% confidence and ${receipt.impactScore} impact.`,
        txHash,
        explorerUrl: arcExplorerTxUrl(txHash),
        createdAt: now,
      });
    }
  }

  store.impactGrants.unshift(...grants);
  store.agentTrustEvents.unshift({
    id: makeId("ate_impact_pool"),
    title: "Sponsor-backed impact pool",
    network: "Arc Testnet",
    status: "ready",
    amountUsdc: sponsorPoolUsdc,
    agent: settlement.sessionId,
    counterparty: "kleos://impact-pool",
    contractAddress: "ImpactPool-ready-sponsor-adapter",
    digest: settlement.receiptHash,
    note:
      "Sponsor capital is allocated only after answer finalization, so creators earn a second bonus when their cited source demonstrably changed the final answer.",
    createdAt: now,
  });

  return {
    settlement,
    impactGrants: grants,
    sponsorPoolUsdc,
    reused: false,
  };
}
