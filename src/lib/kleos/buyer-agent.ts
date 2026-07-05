import { createPaymentProof, settlePayment } from "./charon";
import { KLEOS_AGENT_WALLET } from "./config";
import { recomputePrices } from "./pricing";
import { getCatalogItems, getStore } from "./store";
import type { AgentSession, BuyerDecision } from "./types";

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function scoreRelevance(task: string, tags: string[], text: string) {
  const terms = task
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((term) => term.length > 2);
  const haystack = `${tags.join(" ")} ${text}`.toLowerCase();
  const matches = terms.filter((term) => haystack.includes(term)).length;
  return Math.min(100, 48 + matches * 10 + tags.length * 2);
}

export function runBuyerResearchAgent(input: {
  task: string;
  budgetUsdc: number;
  reservedCitationBudgetUsdc?: number;
  buyerWallet?: string;
  buyerReputation?: number;
  candidateItemIds?: string[];
}) {
  const store = getStore();
  const buyerWallet = input.buyerWallet ?? KLEOS_AGENT_WALLET;
  const buyerReputation = input.buyerReputation ?? 87;
  const sessionId = makeId("session");
  const decisions: BuyerDecision[] = [];
  let spentUsdc = 0;
  const purchasedContent: string[] = [];
  const readBudgetUsdc = Number(
    Math.max(0, input.budgetUsdc - Math.max(0, input.reservedCitationBudgetUsdc ?? 0)).toFixed(6),
  );

  const session: AgentSession = {
    id: sessionId,
    buyerWallet,
    buyerReputation,
    task: input.task,
    budgetUsdc: input.budgetUsdc,
    spentUsdc: 0,
    result: "",
    createdAt: new Date().toISOString(),
  };
  store.agentSessions.unshift(session);

  const scopedCatalog = input.candidateItemIds?.length
    ? getCatalogItems().filter((item) => input.candidateItemIds?.includes(item.id))
    : getCatalogItems();

  const ranked = scopedCatalog
    .map((item) => {
      const relevanceScore = scoreRelevance(input.task, item.tags, item.preview);
      const trustScore = (item.credibilityScore + item.freshnessScore) / 2;
      const reputationDiscount = buyerReputation >= 90 ? 0.92 : buyerReputation >= 80 ? 0.96 : 1;
      const effectivePrice = item.currentPriceUsdc * reputationDiscount;
      const valueScore = Number(((relevanceScore * 0.55 + trustScore * 0.45) / effectivePrice).toFixed(2));

      return {
        item,
        relevanceScore,
        valueScore,
        effectivePrice: Number(effectivePrice.toFixed(6)),
      };
    })
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, 6);

  for (const candidate of ranked) {
    const remainingBudget = readBudgetUsdc - spentUsdc;
    const shouldBuy =
      candidate.relevanceScore >= 58 &&
      candidate.effectivePrice <= remainingBudget &&
      decisions.filter((decision) => decision.decision === "paid").length < 3;

    if (!shouldBuy) {
      const reason =
        candidate.effectivePrice > remainingBudget
          ? `Skipped because the quoted toll exceeded the remaining $${remainingBudget.toFixed(4)} read budget.`
          : "Skipped because cheaper paid sources already covered the task.";

      store.purchaseAttempts.unshift({
        id: makeId("pa"),
        sessionId,
        itemId: candidate.item.id,
        quotedPriceUsdc: candidate.effectivePrice,
        decision: "skipped",
        reason,
        createdAt: new Date().toISOString(),
      });
      decisions.push({
        itemId: candidate.item.id,
        title: candidate.item.title,
        priceUsdc: candidate.effectivePrice,
        relevanceScore: candidate.relevanceScore,
        valueScore: candidate.valueScore,
        decision: "skipped",
        reason,
      });
      continue;
    }

    const paymentSignature = createPaymentProof(candidate.item.id, buyerWallet);
    settlePayment({
      itemId: candidate.item.id,
      sessionId,
      paymentSignature,
    });
    spentUsdc = Number((spentUsdc + candidate.effectivePrice).toFixed(6));
    purchasedContent.push(`${candidate.item.title}: ${candidate.item.fullContent}`);
    const reason = `Paid because relevance ${candidate.relevanceScore}/100 and value score ${candidate.valueScore} fit the remaining budget.`;

    store.purchaseAttempts.unshift({
      id: makeId("pa"),
      sessionId,
      itemId: candidate.item.id,
      quotedPriceUsdc: candidate.effectivePrice,
      decision: "paid",
      reason,
      createdAt: new Date().toISOString(),
    });
    decisions.push({
      itemId: candidate.item.id,
      title: candidate.item.title,
      priceUsdc: candidate.effectivePrice,
      relevanceScore: candidate.relevanceScore,
      valueScore: candidate.valueScore,
      decision: "paid",
      reason,
    });
  }

  const paidTitles = decisions
    .filter((decision) => decision.decision === "paid")
    .map((decision) => decision.title);
  const skippedCount = decisions.filter((decision) => decision.decision === "skipped").length;
  const result =
    paidTitles.length === 0
      ? "The buyer agent refused to spend because no source cleared its relevance and budget threshold."
      : `The buyer agent bought ${paidTitles.length} source${
          paidTitles.length === 1 ? "" : "s"
        } (${paidTitles.join("; ")}) and skipped ${skippedCount}. It inspected the paid material and is ready to finalize citation tolls only for the sources that actually support the answer.`;

  session.spentUsdc = spentUsdc;
  session.result = result;

  const pricingEvents = recomputePrices();

  return {
    session,
    decisions,
    purchasedContent,
    pricingEvents,
  };
}
