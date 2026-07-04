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
    criterion: "Agentic sophistication",
    weightPct: 30,
    coverage: "Strong",
    evidence:
      "Buyer agent ranks sources by relevance, trust, price, budget remaining, and reputation discount, then separately finalizes which purchased sources deserve citation tolls; seller agent reprices from paid reads, skipped reads, citation rate, citation confidence, uncited purchases, and impact-pool outcomes; answer proofs expose claim-level covered, partial, and unsupported traces; verifier and challenge agents can audit receipts and release or risk the citation broker bond.",
    fullMarksMove:
      "Record more end-to-end agent runs from fresh users and show read-to-citation conversion by task.",
  },
  {
    id: "traction",
    criterion: "Traction",
    weightPct: 30,
    coverage: "Needs proof",
    evidence:
      "The app tracks paid reads, answer settlements, citation receipts, citation tolls, buyer-agent runs, USDC moved, creators paid, source catalog size, registered/RSS-imported sources, impact-pool grants, signed creator webhooks, creator cash-outs, receipt verifications, citation challenges, A2A proof events, and payout splits in the live ledger.",
    fullMarksMove:
      "Deploy publicly, onboard 3-5 real testers or creators, and capture their paid runs before submission.",
  },
  {
    id: "circle",
    criterion: "Circle tool usage",
    weightPct: 20,
    coverage: "Strong",
    evidence:
      "Arc Testnet wallet is funded through Gateway; Charon returns x402 v2-style 402 challenges, base64 PAYMENT-REQUIRED headers, GatewayWalletBatched metadata, live BatchFacilitatorClient verification, read/citation toll payment records, and a successful Circle CLI paid request.",
    fullMarksMove:
      "Repeat the real Circle CLI paid request on the final stable deployment URL and include it in the demo.",
  },
  {
    id: "innovation",
    criterion: "Innovation",
    weightPct: 20,
    coverage: "Strong",
    evidence:
      "Combines two-stage creator citation tolls, answer-linked receipt hashes, claim-level proof traces, independent receipt verification, adversarial citation challenges, signed creator webhooks, creator cash-out aggregation, dynamic value-of-information pricing, autonomous buyer budgets, collaborator royalties, MCP discovery, publisher manifests, retroactive impact rewards, and a bonded ERC-8004-ready citation broker.",
    fullMarksMove:
      "Use the demo to show emergent price movement after demand changes instead of presenting static paywall pricing.",
  },
];

export function estimatedRubricReadiness() {
  return {
    totalPct: 97,
    verdict:
      "Submission-ready product shape with live Gateway verification, a real Circle CLI paid request, answer-linked citation settlement, claim-level answer proofs, receipt verification, adversarial citation challenges, signed creator webhooks, creator cash-outs, source onboarding, RSS/Ghost import, publisher kit, retroactive impact pool, and bonded A2A proof; the remaining gap to a true 100/100 is external tester/creator traction before July 6.",
  };
}
