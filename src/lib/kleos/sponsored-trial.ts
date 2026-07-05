import { runBuyerResearchAgent } from "./buyer-agent";
import { finalizeAnswerCitations } from "./citation-settlement";
import { KLEOS_AGENT_WALLET } from "./config";
import { settleImpactPool } from "./impact-pool";
import { recomputePrices } from "./pricing";
import { getCatalogItems } from "./store";

const DEFAULT_TASK =
  "Evaluate Kleos as a settlement layer for grounded AI answers, including x402, citation receipts, creator payouts, and dynamic repricing.";

export function runSponsoredTrial(input?: {
  task?: string;
  budgetUsdc?: number;
  citationBudgetUsdc?: number;
  sponsorPoolUsdc?: number;
}) {
  const buyerReputation = 94;
  const cheapestViable = getCatalogItems()
    .map((item) => {
      const effectiveReadTollUsdc = Number((item.currentPriceUsdc * 0.92).toFixed(6));
      const citationTollUsdc = Number(
        Math.max(0.000001, item.citationPriceUsdc ?? item.currentPriceUsdc * 0.35).toFixed(6),
      );

      return {
        effectiveReadTollUsdc,
        citationTollUsdc,
        totalUsdc: Number((effectiveReadTollUsdc + citationTollUsdc).toFixed(6)),
      };
    })
    .sort((left, right) => left.totalUsdc - right.totalUsdc)[0];
  const requestedCitationBudgetUsdc = Math.max(input?.citationBudgetUsdc ?? 0.006, 0.001);
  const minimumViableBudgetUsdc = cheapestViable
    ? Math.min(0.03, Number((cheapestViable.effectiveReadTollUsdc + requestedCitationBudgetUsdc).toFixed(6)))
    : 0.004;
  const budgetUsdc = Math.min(Math.max(input?.budgetUsdc ?? 0.018, minimumViableBudgetUsdc), 0.03);
  const citationBudgetUsdc = Math.min(requestedCitationBudgetUsdc, budgetUsdc);
  const sponsorPoolUsdc = Math.min(Math.max(input?.sponsorPoolUsdc ?? 0.012, 0.001), 0.025);
  const task = input?.task?.trim() || DEFAULT_TASK;

  const research = runBuyerResearchAgent({
    task,
    budgetUsdc,
    reservedCitationBudgetUsdc: citationBudgetUsdc,
    buyerWallet: KLEOS_AGENT_WALLET,
    buyerReputation,
  });
  const citations = finalizeAnswerCitations({
    sessionId: research.session.id,
    answer:
      "Kleos lets agents inspect paid sources, cite only evidence that supports the final answer, and settle read tolls, citation tolls, collaborator splits, and impact rewards through Arc-ready proof records.",
    maxCitationSpendUsdc: citationBudgetUsdc,
  });
  const impact = settleImpactPool({
    settlementId: citations.settlement.id,
    sponsorPoolUsdc,
  });
  const pricingEvents = recomputePrices();

  return {
    trial: {
      mode: "sponsored-no-wallet",
      sponsor: "kleos://shadow-float-v2",
      buyerWallet: KLEOS_AGENT_WALLET,
      budgetUsdc,
      citationBudgetUsdc,
      sponsorPoolUsdc,
      spendGuardrails: [
        "Budget is hard-capped before the buyer agent runs.",
        "Citation tolls are capped separately from read tolls.",
        "Impact rewards are paid only after answer-linked citation receipts exist.",
      ],
      completedAt: new Date().toISOString(),
    },
    research,
    citations,
    impact,
    pricingEvents,
  };
}
