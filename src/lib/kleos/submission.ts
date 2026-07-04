import { getLedgerSnapshot } from "./ledger";

export function buildSubmissionReport() {
  const ledger = getLedgerSnapshot();

  return {
    project: {
      name: "Kleos",
      oneLine:
        "The settlement layer for grounded AI answers: agents pay to inspect creator sources, pay citation tolls only when they use them, and Arc settles each tiny payment to collaborators.",
      category:
        "Creator and publisher monetization with autonomous paying agents and agent-to-agent reputation hooks.",
      primaryRfb: "RFB 6 - Creator & Publisher Monetization",
      supportingRfbs: [
        "RFB 1 - Autonomous Paying Agents",
        "RFB 3 - Agent-to-Agent Nanopayment Networks",
        "RFB 5 - Nanopayment Infrastructure & Tooling",
      ],
    },
    judgePath: [
      "Open the dashboard and inspect the source catalog.",
      "Click Run agent to make the buyer spend from a fixed USDC budget.",
      "Click Finalize citations or Run scenario to settle only the sources used in the final answer.",
      "Review paid reads, skipped reads, answer-linked citation receipts, and bought-but-not-cited sources.",
      "Open x402 settlement records and collaborator split payouts for both read tolls and citation tolls.",
      "Click Reprice sources to see the seller pricing agent react to demand.",
      "Inspect /api/catalog, /api/content/:id, /api/citations/finalize, /api/answers/proof, /api/webhooks/dispatch, /api/creators/cashout, /api/dashboard/ledger, /api/mcp, and /api/submission/report.",
      "Open /api/provenance or /api/submission/certificate to verify deployment, CI, live x402, score honesty, and remaining traction gates in one object.",
    ],
    implementation: {
      surfaces: [
        "Charon content gateway with x402-style 402 challenges.",
        "Base64 PAYMENT-REQUIRED header with GatewayWalletBatched metadata.",
        "Budgeted buyer research agent.",
        "Answer finalization with second-stage citation toll settlement.",
        "Seller pricing agent using paid reads, skipped reads, citation rate, and citation confidence.",
        "Creator source registration flow.",
        "RSS/Ghost-style import path for creator onboarding.",
        "Citation receipts tying answer hashes, support spans, read payments, citation payments, and split payouts to grounded claims.",
        "Shareable answer proof endpoint with claim-level covered, partial, and unsupported support traces.",
        "Signed creator webhook dispatch records for citation, impact, and cash-out events.",
        "Creator cash-out ledger that aggregates split and impact balances into Arc-ready settlement records.",
        "Creator-scoped source registry with IPFS-shaped metadata/content CIDs, split digests, and a deployable Arc contract artifact.",
        "Encrypted content vault with public AES-GCM ciphertext and x402-gated key release.",
        "A2A paid research endpoint for agents that want to buy a grounded answer from Kleos over x402.",
        "A2A trust-event ledger plus a local bonded citation broker for ERC-8004-ready reputation.",
        "Well-known agent card exposing Kleos wallet, x402 payment schemes, service endpoints, proof links, and ERC-8004-ready identity posture.",
        "Retroactive impact pool that allocates sponsor capital only after citations prove which sources changed an answer.",
        "One-command tester runner that checks the live deployment, runs the no-wallet scenario, mints a proof hash, and prints the public GitHub issue URL.",
        "Publisher kit for RSS/Ghost-style creators through /.well-known/kleos.json and crawler payment policy.",
        "MCP-style catalog manifest.",
        "Publishable `packages/kleos-mcp` stdio bridge so MCP clients can call Kleos tools through a one-command agent connector.",
        "Submission certificate endpoint that binds the stable deployment, GitHub repo, CI status, live x402 receipt, rubric score, and public traction gates.",
        "RoyaltySplitter smart contract.",
        "Judge dashboard and ledger APIs.",
      ],
      currentPaymentMode:
        "Live Circle Gateway x402 verification through BatchFacilitatorClient is implemented for real PAYMENT-SIGNATURE payloads, with a local judge walkthrough proof path kept for deterministic async review.",
      fullCircleGatewayMove:
        "A real Circle CLI paid request has succeeded against the stable public content endpoint. Include the receipt and Arcscan link in the video.",
    },
    rubric: ledger.rubric,
    liveMetrics: ledger.metrics,
    gatewayProof: ledger.gatewayProof,
    citationReceipts: ledger.citationReceipts.slice(0, 10),
    answerSettlements: ledger.answerSettlements.slice(0, 5),
    impactGrants: ledger.impactGrants.slice(0, 10),
    claimTraces: ledger.claimTraces.slice(0, 10),
    webhookDeliveries: ledger.webhookDeliveries.slice(0, 10),
    creatorCashouts: ledger.creatorCashouts.slice(0, 10),
    agentTrustEvents: ledger.agentTrustEvents,
    catalogSize: ledger.catalog.length,
    submissionChecklist: [
      "Public GitHub repo",
      "Live deployed URL",
      "Video demo under 3 minutes",
      "Real testnet USDC payment flow shown",
      "Traction notes: users onboarded, creators/sources onboarded, buyer-agent runs, and user problem",
      "README with local setup and judge path",
    ],
  };
}
