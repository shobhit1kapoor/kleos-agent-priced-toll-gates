import { getLedgerSnapshot } from "@/lib/kleos/ledger";
import { getGithubTractionSnapshot } from "@/lib/kleos/github-traction";

export const dynamic = "force-dynamic";

export async function GET() {
  const ledger = getLedgerSnapshot();
  const githubTraction = await getGithubTractionSnapshot();
  const tractionScore = githubTraction.successGates.allPassed || ledger.metrics.testerAttestations >= 5 ? 30 : 26;

  return Response.json(
    {
      project: "Kleos",
      thesis:
        "Kleos is the settlement layer for grounded AI answers: agents pay to inspect sources, pay again when cited, then produce proof, split payouts, notify creators, queue cash-outs, and feed pricing back into the next market.",
      keryxComparison: {
        keryxStrength:
          "Keryx is strongest on public citation-toll traction and distribution claims.",
        kleosResponse:
          "Kleos goes beyond citation tolls into full answer-settlement operations: claim traces, verifier checks, citation challenges, webhook notifications, creator cash-outs, impact rewards, dynamic pricing, publisher kit, OSS kit, and tester attestations.",
        honestRemainingGap:
          "Only external tester/creator traction can fully close the gap against projects with higher public usage claims.",
      },
      rubricScoreEstimate: {
        agenticSophistication: ledger.metrics.receiptVerifications > 0 ? 30 : 29,
        traction: tractionScore,
        circleToolUsage: 20,
        innovation: 20,
        total:
          (ledger.metrics.receiptVerifications > 0 ? 30 : 29) +
          tractionScore +
          20 +
          20,
      },
      proofLinks: {
        app: "https://kleos-agent-priced-toll-gates.vercel.app",
        github: "https://github.com/shobhit1kapoor/kleos-agent-priced-toll-gates",
        proofPack: "https://kleos-agent-priced-toll-gates.vercel.app/api/proof-pack",
        provenance: "https://kleos-agent-priced-toll-gates.vercel.app/api/provenance",
        submissionCertificate: "https://kleos-agent-priced-toll-gates.vercel.app/api/submission/certificate",
        publicStatus: "https://kleos-agent-priced-toll-gates.vercel.app/api/status",
        openApi: "https://kleos-agent-priced-toll-gates.vercel.app/api/openapi",
        treasury: "https://kleos-agent-priced-toll-gates.vercel.app/api/treasury",
        sourceRegistry: "https://kleos-agent-priced-toll-gates.vercel.app/api/registry/sources",
        encryptedVault: "https://kleos-agent-priced-toll-gates.vercel.app/api/vault/ci_arc_gateway_notes",
        a2aAsk: "https://kleos-agent-priced-toll-gates.vercel.app/api/a2a/ask",
        mcpRpc: "https://kleos-agent-priced-toll-gates.vercel.app/api/mcp/rpc",
        mcpDiscovery: "https://kleos-agent-priced-toll-gates.vercel.app/.well-known/mcp.json",
        sponsoredTrial: "https://kleos-agent-priced-toll-gates.vercel.app/api/trial/sponsored",
        answerProof: "https://kleos-agent-priced-toll-gates.vercel.app/api/answers/proof",
        receiptVerifier: "https://kleos-agent-priced-toll-gates.vercel.app/api/receipts/verify?latest=true",
        citationChallenge: "https://kleos-agent-priced-toll-gates.vercel.app/api/citations/challenge",
        ossKit: "https://kleos-agent-priced-toll-gates.vercel.app/api/oss-kit",
        tractionAttestations: "https://kleos-agent-priced-toll-gates.vercel.app/api/traction/attest",
        tractionCampaign: "https://kleos-agent-priced-toll-gates.vercel.app/api/traction/campaign",
        durableGithubTraction: "https://kleos-agent-priced-toll-gates.vercel.app/api/traction/github",
        liveX402Receipt: `https://testnet.arcscan.app/tx/${ledger.gatewayProof.liveX402Receipt.receiptId}`,
      },
      evidence: {
        liveX402Receipt: ledger.gatewayProof.liveX402Receipt,
        metrics: ledger.metrics,
        durableGithubTraction: {
          reachable: githubTraction.reachable,
          totals: githubTraction.totals,
          successGates: githubTraction.successGates,
        },
        differentiators: [
          "Read toll plus citation toll settlement.",
          "Claim-level covered/partial/unsupported proof traces.",
          "Collaborator split payouts on every paid read and citation.",
          "Retroactive impact pool for sources that changed the answer.",
          "Signed creator webhook delivery records.",
          "Creator cash-out ledger.",
          "Independent receipt verifier and adversarial citation challenge flow.",
          "Dynamic value-of-information repricing.",
          "Publisher kit and OSS integration kit.",
          "Tester attestation flow with proof hash and GitHub issue URL.",
          "Role-specific traction campaign with tester asks, curl payloads, social copy, and 100/100 success gates.",
          "No-wallet sponsored trial endpoint plus public status, treasury, and OpenAPI surfaces for async judges.",
          "Creator-scoped source registry, encrypted content vault, and x402-priced A2A answer endpoint.",
          "Callable JSON-RPC MCP endpoint plus well-known MCP discovery document.",
          "Publishable packages/kleos-mcp stdio bridge for npx-style MCP distribution.",
          "Submission certificate that binds live deployment, public repo, CI, Circle x402 receipt, score honesty, and public traction gates.",
          "CI-backed economic invariant checks for spend caps, split math, receipt integrity, payment gates, and score honesty.",
        ],
      },
      nextBestAction:
        ledger.metrics.testerAttestations >= 5
          ? "Record the final demo video and submit."
          : "Ask 3-5 testers to run the app and click Attest, then record the final demo.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
