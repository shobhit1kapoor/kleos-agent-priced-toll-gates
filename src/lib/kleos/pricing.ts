import { getStore } from "./store";

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function recomputePrices() {
  const store = getStore();
  const events = [];

  for (const item of store.contentItems) {
    const recentAttempts = store.purchaseAttempts
      .filter((attempt) => attempt.itemId === item.id)
      .slice(0, 20);
    const paidCount = recentAttempts.filter((attempt) => attempt.decision === "paid").length;
    const unpaidCount = recentAttempts.filter((attempt) => attempt.decision === "challenged").length;
    const skippedCount = recentAttempts.filter((attempt) => attempt.decision === "skipped").length;
    const citationReceipts = store.citationReceipts
      .filter((receipt) => receipt.itemId === item.id)
      .slice(0, 20);
    const citationCount = citationReceipts.length;
    const averageConfidence =
      citationCount > 0
        ? Math.round(
            citationReceipts.reduce((sum, receipt) => sum + receipt.confidence, 0) / citationCount,
          )
        : 0;
    const purchasedButUncited = store.payments.filter(
      (payment) =>
        payment.itemId === item.id &&
        payment.kind === "read" &&
        !store.citationReceipts.some((receipt) => receipt.readPaymentId === payment.id),
    ).length;
    const oldPrice = item.currentPriceUsdc;

    let multiplier = 1;
    let reason = "No recent demand signal; price held steady.";

    if (citationCount >= 2 && averageConfidence >= 84) {
      multiplier = 1.24;
      reason = `Raised because this source was opened ${paidCount} time${
        paidCount === 1 ? "" : "s"
      }, cited ${citationCount} time${citationCount === 1 ? "" : "s"}, and averaged ${averageConfidence}% citation confidence.`;
    } else if (purchasedButUncited >= 2 && citationCount === 0) {
      multiplier = 0.86;
      reason = `Lowered because ${purchasedButUncited} paid inspections did not become final answer citations.`;
    } else if (paidCount >= 2 && paidCount >= unpaidCount + skippedCount) {
      multiplier = 1.14;
      reason = `Raised because ${paidCount} recent buyer agents paid the read toll.`;
    } else if (unpaidCount + skippedCount >= 2 && paidCount === 0) {
      multiplier = 0.82;
      reason = `Lowered because ${unpaidCount + skippedCount} recent agents refused or skipped the toll.`;
    } else if (paidCount > 0 && unpaidCount > paidCount) {
      multiplier = 0.92;
      reason = `Soft-lowered because unpaid 402s exceeded paid conversions.`;
    }

    const newPrice = Number(
      clamp(oldPrice * multiplier, item.minPriceUsdc, item.maxPriceUsdc).toFixed(6),
    );

    if (newPrice !== oldPrice) {
      item.currentPriceUsdc = newPrice;
      const event = {
        id: makeId("pe"),
        itemId: item.id,
        oldPriceUsdc: oldPrice,
        newPriceUsdc: newPrice,
        reason,
        createdAt: new Date().toISOString(),
      };
      store.pricingEvents.unshift(event);
      events.push(event);
    }
  }

  return events;
}
