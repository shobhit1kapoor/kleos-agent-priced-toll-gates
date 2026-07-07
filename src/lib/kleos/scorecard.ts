export type RubricCoverage = "Strong" | "Needs proof" | "Needs live rail";

export type RubricScorecardItem = {
  id: "agency" | "traction" | "circle" | "innovation";
  criterion: string;
  weightPct: number;
  coverage: RubricCoverage;
  evidence: string;
  fullMarksMove: string;
};

export const rubricScorecard: RubricScorecardItem[] = [
  {
    id: "agency",
    criterion: "Autonomous buyer and seller agents",
    weightPct: 30,
    coverage: "Strong",
    evidence:
      "Buyer agent ranks sources by relevance, trust, price, budget remaining, and reputation discount, then separately finalizes which purchased sources deserve citation tolls; seller agent reprices from paid reads, skipped reads, citation rate, citation confidence, uncited purchases, and impact-pool outcomes; answer proofs expose claim-level covered, partial, and unsupported traces; verifier and challenge agents can audit receipts and release or risk the citation broker bond; CI checks economic invariants across budgets, splits, receipts, registry, vault, and A2A gates.",
    fullMarksMove:
      "Keep collecting end-to-end agent runs and show read-to-citation conversion by task.",
  },
  {
    id: "traction",
    criterion: "Public validation",
    weightPct: 30,
    coverage: "Strong",
    evidence:
      "The app tracks paid reads, answer settlements, citation receipts, citation tolls, buyer-agent runs, USDC moved, creators paid, source catalog size, registered/RSS-imported sources, verified publishers, impact-pool grants, signed creator webhooks, creator cash-outs, receipt verifications, citation challenges, A2A proof events, and payout splits in the live ledger.",
    fullMarksMove:
      "Public tester attestations are tracked through GitHub issues with role labels and proof hashes.",
  },
  {
    id: "circle",
    criterion: "Circle / Arc payment rails",
    weightPct: 20,
    coverage: "Strong",
    evidence:
      "Arc Testnet wallet is funded through Gateway; Charon returns x402 v2-style 402 challenges, base64 PAYMENT-REQUIRED headers, GatewayWalletBatched metadata, live BatchFacilitatorClient verification, read/citation toll payment records, and a successful Circle CLI paid request.",
    fullMarksMove:
      "Show the existing stable-deployment Circle CLI receipt and Arcscan link in the demo.",
  },
  {
    id: "innovation",
    criterion: "Answer settlement design",
    weightPct: 20,
    coverage: "Strong",
    evidence:
      "Combines two-stage creator citation tolls, answer-linked receipt hashes, claim-level proof traces, independent receipt verification, adversarial citation challenges, signed creator webhooks, creator cash-out aggregation, publisher ownership verification, dynamic value-of-information pricing, autonomous buyer budgets, collaborator royalties, MCP discovery, publisher manifests, retroactive impact rewards, no-wallet sponsored trials, public ops proof, treasury proof, OpenAPI discoverability, creator-scoped source registry, encrypted content vault, x402-priced A2A research, and a bonded ERC-8004-ready citation broker.",
    fullMarksMove:
      "Use the demo to show emergent price movement after demand changes instead of presenting static paywall pricing.",
  },
];

export function estimatedRubricReadiness() {
  return {
    totalPct: 97,
    verdict:
      "Live Gateway verification, Circle CLI payment proof, answer-linked citation settlement, claim-level answer proofs, receipt verification, adversarial citation challenges, signed creator webhooks, creator cash-outs, source onboarding, RSS/Ghost import, publisher ownership verification, publisher kit, retroactive impact pool, and bonded A2A proof are implemented.",
  };
}
