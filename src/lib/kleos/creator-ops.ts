import { ARC_EXPLORER_TX_BASE } from "./config";
import { makeHash } from "./charon";
import { getStore } from "./store";
import type { CreatorCashout, CreatorWebhook, WebhookDelivery } from "./types";

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function signPayload(secretHash: string, payloadDigest: string) {
  return makeHash(`${secretHash}:${payloadDigest}`);
}

function creatorEarnedUsdc(creatorId: string) {
  const store = getStore();
  const splitTotal = store.payoutSplits
    .filter((split) => split.creatorId === creatorId)
    .reduce((sum, split) => sum + split.amountUsdc, 0);
  const impactTotal = store.impactGrants
    .filter((grant) => grant.creatorId === creatorId)
    .reduce((sum, grant) => sum + grant.amountUsdc, 0);

  return Number((splitTotal + impactTotal).toFixed(6));
}

function creatorCashedOutUsdc(creatorId: string) {
  return Number(
    getStore()
      .creatorCashouts.filter((cashout) => cashout.creatorId === creatorId)
      .reduce((sum, cashout) => sum + cashout.amountUsdc, 0)
      .toFixed(6),
  );
}

export function dispatchCreatorWebhooks(input: {
  settlementId?: string;
  eventType?: CreatorWebhook["eventTypes"][number];
}) {
  const store = getStore();
  const settlement = input.settlementId
    ? store.answerSettlements.find((entry) => entry.id === input.settlementId)
    : store.answerSettlements[0];
  const eventType = input.eventType ?? "citation.settled";
  const deliveries: WebhookDelivery[] = [];

  if (!settlement) {
    return {
      settlement: null,
      deliveries,
      message: "No finalized answer settlement is available for webhook dispatch.",
    };
  }

  const receipts = store.citationReceipts.filter((receipt) => receipt.sessionId === settlement.sessionId);
  const creatorIds = new Set<string>();
  for (const receipt of receipts) {
    const collaborators = store.collaborators.filter((collaborator) => collaborator.itemId === receipt.itemId);
    for (const collaborator of collaborators) {
      creatorIds.add(collaborator.creatorId);
    }
  }

  for (const creatorId of creatorIds) {
    const webhook = store.creatorWebhooks.find(
      (entry) =>
        entry.creatorId === creatorId &&
        entry.status === "active" &&
        entry.eventTypes.includes(eventType),
    );
    if (!webhook) {
      continue;
    }

    const payloadDigest = makeHash(
      JSON.stringify({
        eventType,
        creatorId,
        settlementId: settlement.id,
        answerHash: settlement.answerHash,
        receipts: receipts
          .filter((receipt) =>
            store.collaborators.some(
              (collaborator) =>
                collaborator.itemId === receipt.itemId && collaborator.creatorId === creatorId,
            ),
          )
          .map((receipt) => receipt.receiptHash),
      }),
    );
    const delivery: WebhookDelivery = {
      id: makeId("whd"),
      webhookId: webhook.id,
      creatorId,
      eventType,
      targetUrl: webhook.url,
      payloadDigest,
      signature: signPayload(webhook.secretHash, payloadDigest),
      status: "signed_queued",
      attempts: 1,
      createdAt: now(),
    };
    store.webhookDeliveries.unshift(delivery);
    deliveries.push(delivery);
  }

  return {
    settlement,
    deliveries,
    message: `${deliveries.length} signed creator webhook delivery record${
      deliveries.length === 1 ? "" : "s"
    } queued.`,
  };
}

export function createCreatorCashouts() {
  const store = getStore();
  const cashouts: CreatorCashout[] = [];

  for (const creator of store.creators) {
    const earned = creatorEarnedUsdc(creator.id);
    const alreadyCashedOut = creatorCashedOutUsdc(creator.id);
    const due = Number((earned - alreadyCashedOut).toFixed(6));
    if (due <= 0) {
      continue;
    }

    const txHash = makeHash(`${creator.id}:${due}:${Date.now()}`);
    const cashout: CreatorCashout = {
      id: makeId("cashout"),
      creatorId: creator.id,
      amountUsdc: due,
      sourceCount: new Set(
        store.payoutSplits
          .filter((split) => split.creatorId === creator.id)
          .map((split) => {
            const payment = store.payments.find((entry) => entry.id === split.paymentId);
            return payment?.itemId;
          })
          .filter(Boolean),
      ).size,
      status: "queued_arc_settlement",
      txHash,
      explorerUrl: `${ARC_EXPLORER_TX_BASE}/${txHash}`,
      createdAt: now(),
    };
    store.creatorCashouts.unshift(cashout);
    cashouts.push(cashout);
  }

  if (cashouts.length > 0) {
    dispatchCreatorWebhooks({
      settlementId: store.answerSettlements[0]?.id,
      eventType: "cashout.created",
    });
  }

  return {
    cashouts,
    totals: {
      creatorsWithCashout: cashouts.length,
      amountUsdc: Number(cashouts.reduce((sum, cashout) => sum + cashout.amountUsdc, 0).toFixed(6)),
      allTimeCashouts: store.creatorCashouts.length,
    },
  };
}

export function getCreatorOpsSnapshot() {
  const store = getStore();

  return {
    webhooks: store.creatorWebhooks,
    deliveries: store.webhookDeliveries,
    cashouts: store.creatorCashouts,
    creatorBalances: store.creators.map((creator) => ({
      creatorId: creator.id,
      displayName: creator.displayName,
      wallet: creator.wallet,
      earnedUsdc: creatorEarnedUsdc(creator.id),
      cashedOutUsdc: creatorCashedOutUsdc(creator.id),
      availableUsdc: Number((creatorEarnedUsdc(creator.id) - creatorCashedOutUsdc(creator.id)).toFixed(6)),
    })),
  };
}
