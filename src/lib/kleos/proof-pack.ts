import { getLedgerSnapshot } from "./ledger";
import { buildPublisherKit } from "./publisher-kit";
import { buildSubmissionReport } from "./submission";
import { buildAnswerProof } from "./answer-proof";

export function buildProofPack(origin?: string) {
  const ledger = getLedgerSnapshot();
  const report = buildSubmissionReport();
  const publisherKit = buildPublisherKit(origin);
  const answerProof = buildAnswerProof(undefined, origin);

  return {
    generatedAt: new Date().toISOString(),
    project: report.project,
    verdict:
      "Kleos differentiates from generic x402 demos by proving the full creator value loop: inspect, cite, split, reprice, and retroactively reward what mattered.",
    strongestDifferentiators: [
      "Two-stage economics: read tolls unlock sources, citation tolls pay only sources used in final answers.",
      "Answer-linked receipts: every citation has an answer hash, support span, read payment, citation payment, confidence, and receipt hash.",
      "Claim-level proof: finalized answers expose covered, partial, and unsupported claims with receipt-backed support traces.",
      "Creator operations: signed webhook delivery records and Arc-ready cash-out records are generated from citation and impact settlement.",
      "Tester attestation loop: every tester can mint a signed proof hash and prefilled GitHub issue from the live app.",
      "OSS kit: builders get copy-paste agent, publisher, proof, webhook, cash-out, and attestation integration steps.",
      "Retroactive impact pool: sponsor capital is allocated after citations prove which sources changed the answer.",
      "Publisher kit: a concrete /.well-known/kleos.json path for RSS/Ghost creators and crawler payment policy.",
      "Citation-aware seller pricing: prices react to paid reads, skipped demand, citation rate, confidence, and uncited purchases.",
    ],
    judgeSequence: [
      "Run scenario",
      "Open /api/dashboard/ledger",
      "Open /api/proof-pack",
      "Open /api/answers/proof",
      "POST /api/webhooks/dispatch",
      "POST /api/creators/cashout",
      "POST /api/traction/attest",
      "Open /api/oss-kit",
      "Open /api/competitive/positioning",
      "Open /api/publisher-kit",
      "Run corepack pnpm smoke",
      "Review the live Circle CLI Gateway receipt, then repeat it on the final stable URL",
    ],
    rubric: report.rubric,
    metrics: ledger.metrics,
    gatewayProof: ledger.gatewayProof,
    latestAnswerSettlement: ledger.answerSettlements[0] ?? null,
    latestAnswerProof: answerProof,
    latestCitationReceipts: ledger.citationReceipts.slice(0, 5),
    impactGrants: ledger.impactGrants.slice(0, 8),
    creatorWebhooks: ledger.creatorWebhooks.slice(0, 8),
    webhookDeliveries: ledger.webhookDeliveries.slice(0, 8),
    creatorCashouts: ledger.creatorCashouts.slice(0, 8),
    testerAttestations: ledger.testerAttestations.slice(0, 8),
    publisherKit: publisherKit.wellKnownManifest,
    apiSurfaces: [
      "GET /api/catalog",
      "GET /api/content/:id",
      "POST /api/agent/research",
      "POST /api/citations/finalize",
      "GET /api/answers/proof",
      "POST /api/impact/settle",
      "POST /api/webhooks/dispatch",
      "POST /api/creators/cashout",
      "GET /api/traction/attest",
      "POST /api/traction/attest",
      "POST /api/pricing/recompute",
      "POST /api/sources/register",
      "GET /api/mcp",
      "GET /api/publisher-kit",
      "GET /api/oss-kit",
      "GET /api/competitive/positioning",
      "GET /api/proof-pack",
      "GET /api/submission/report",
    ],
    openDeploymentItems: [
      "Stable public hosted URL",
      "3-5 external tester runs or creator source registrations",
      "Final demo video under 3 minutes",
    ],
  };
}
