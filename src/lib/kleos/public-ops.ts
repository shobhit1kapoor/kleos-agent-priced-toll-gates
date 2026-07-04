import { getGithubTractionSnapshot } from "./github-traction";
import { buildImpactGraph } from "./impact-graph";
import { getLedgerSnapshot } from "./ledger";
import { buildSourceRegistry } from "./source-registry";
import { buildTransparencyLog } from "./transparency-log";

const APP_URL = "https://kleos-agent-priced-toll-gates.vercel.app";
const GITHUB_URL = "https://github.com/shobhit1kapoor/kleos-agent-priced-toll-gates";

export async function buildPublicStatus() {
  const ledger = getLedgerSnapshot();
  const githubTraction = await getGithubTractionSnapshot();
  const sourceRegistry = buildSourceRegistry();
  const transparencyLog = buildTransparencyLog();
  const impactGraph = buildImpactGraph();

  const checks = [
    {
      id: "catalog",
      label: "Priced source catalog",
      status: ledger.catalog.length >= 5 ? "pass" : "warn",
      detail: `${ledger.catalog.length} priced sources indexed.`,
    },
    {
      id: "x402",
      label: "Live x402 Gateway receipt",
      status: ledger.gatewayProof.liveX402Receipt.receiptId ? "pass" : "fail",
      detail: ledger.gatewayProof.liveX402Receipt.receiptId
        ? `${ledger.gatewayProof.liveX402Receipt.amountUsdc} testnet USDC via ${ledger.gatewayProof.liveX402Receipt.scheme}.`
        : "No live x402 receipt configured.",
    },
    {
      id: "answer-settlement",
      label: "Answer settlement proof",
      status: ledger.metrics.answerSettlements >= 1 && ledger.metrics.citationReceipts >= 1 ? "pass" : "warn",
      detail: `${ledger.metrics.answerSettlements} answer settlement(s), ${ledger.metrics.citationReceipts} citation receipt(s).`,
    },
    {
      id: "creator-ops",
      label: "Creator operations",
      status: ledger.metrics.creatorWebhooks >= 1 && ledger.metrics.creatorCashouts >= 1 ? "pass" : "warn",
      detail: `${ledger.metrics.webhookDeliveries} webhook delivery record(s), ${ledger.metrics.creatorCashouts} cash-out batch(es).`,
    },
    {
      id: "audit",
      label: "Receipt audit layer",
      status: ledger.metrics.validReceiptVerifications >= 1 && ledger.metrics.citationChallenges >= 1 ? "pass" : "warn",
      detail: `${ledger.metrics.validReceiptVerifications} valid verification(s), ${ledger.metrics.citationChallenges} challenge(s).`,
    },
    {
      id: "source-registry",
      label: "Source registry",
      status: sourceRegistry.records.length >= ledger.catalog.length ? "pass" : "warn",
      detail: `${sourceRegistry.records.length} creator-scoped source record(s), ${sourceRegistry.totals.multiAuthorSources} multi-author source(s).`,
    },
    {
      id: "transparency-log",
      label: "Transparency log",
      status: transparencyLog.entryCount >= ledger.payments.length ? "pass" : "warn",
      detail: `${transparencyLog.entryCount} audited settlement/audit entries rooted at ${transparencyLog.rootHash.slice(0, 12)}...`,
    },
    {
      id: "impact-graph",
      label: "Impact graph",
      status: impactGraph.summary.edges >= 1 ? "pass" : "warn",
      detail: `${impactGraph.summary.nodes} node(s), ${impactGraph.summary.edges} edge(s), ${impactGraph.summary.valueFlowUsdc} USDC traced.`,
    },
    {
      id: "public-traction",
      label: "Public tester traction",
      status: githubTraction.successGates.allPassed ? "pass" : "warn",
      detail: `${githubTraction.totals.githubIssueAttestations} public GitHub attestation issue(s).`,
    },
  ];

  const status = checks.some((check) => check.status === "fail")
    ? "degraded"
    : checks.every((check) => check.status === "pass")
      ? "excellent"
      : "ready-needs-traction";

  return {
    name: "Kleos public operations status",
    status,
    generatedAt: new Date().toISOString(),
    app: APP_URL,
    github: GITHUB_URL,
    summary:
      status === "excellent"
        ? "Core product, proof, Circle, creator-ops, and public traction gates are all passing."
        : "Core product, proof, and Circle gates are live; final public traction attestations remain the honest 100/100 gap.",
    checks,
    publicProofs: {
      dashboard: APP_URL,
      proofExplorer: `${APP_URL}/proof`,
      testerPage: `${APP_URL}/test`,
      agentCard: `${APP_URL}/.well-known/agent-card.json`,
      catalog: `${APP_URL}/api/catalog`,
      openApi: `${APP_URL}/api/openapi`,
      treasury: `${APP_URL}/api/treasury`,
      sourceRegistry: `${APP_URL}/api/registry/sources`,
      encryptedVault: `${APP_URL}/api/vault/ci_arc_gateway_notes`,
      a2aAsk: `${APP_URL}/api/a2a/ask`,
      mcpRpc: `${APP_URL}/api/mcp/rpc`,
      mcpDiscovery: `${APP_URL}/.well-known/mcp.json`,
      proofPack: `${APP_URL}/api/proof-pack`,
      provenance: `${APP_URL}/api/provenance`,
      submissionCertificate: `${APP_URL}/api/submission/certificate`,
      receiptVerifier: `${APP_URL}/api/receipts/verify?latest=true`,
      impactGraph: `${APP_URL}/api/impact/graph`,
      transparencyLog: `${APP_URL}/api/transparency/log`,
      githubTraction: `${APP_URL}/api/traction/github`,
      oneClickTester: `${APP_URL}/api/tester/one-click`,
      sponsoredTrial: `${APP_URL}/api/trial/sponsored`,
      liveX402Receipt: ledger.gatewayProof.liveX402Receipt.receiptId
        ? `https://testnet.arcscan.app/tx/${ledger.gatewayProof.liveX402Receipt.receiptId}`
        : null,
    },
    metrics: ledger.metrics,
    durableGithubTraction: {
      reachable: githubTraction.reachable,
      totals: githubTraction.totals,
      successGates: githubTraction.successGates,
    },
    sourceRegistry: {
      mode: sourceRegistry.mode,
      contract: sourceRegistry.contract,
      totals: sourceRegistry.totals,
    },
    transparencyLog: {
      schema: transparencyLog.schema,
      rootHash: transparencyLog.rootHash,
      entryCount: transparencyLog.entryCount,
      totals: transparencyLog.totals,
    },
    impactGraph: {
      schema: impactGraph.schema,
      graphHash: impactGraph.graphHash,
      summary: impactGraph.summary,
    },
  };
}

export function buildTreasuryProof() {
  const ledger = getLedgerSnapshot();
  const readTolls = ledger.payments.filter((payment) => payment.kind === "read");
  const citationTolls = ledger.payments.filter((payment) => payment.kind === "citation");
  const splitTotalUsdc = ledger.payoutSplits.reduce((sum, split) => sum + split.amountUsdc, 0);
  const impactTotalUsdc = ledger.impactGrants.reduce((sum, grant) => sum + grant.amountUsdc, 0);

  return {
    name: "Kleos treasury and settlement proof",
    generatedAt: new Date().toISOString(),
    network: ledger.gatewayProof.network,
    custodyModel:
      "Demo treasury records are non-custodial proof objects: x402/Gateway receipts, collaborator split ledgers, and Arc-ready cash-out batches are linked for judge verification.",
    gateway: ledger.gatewayProof,
    totals: {
      fundedGatewayBalanceUsdc: ledger.gatewayProof.fundedBalanceUsdc,
      liveX402PaidUsdc: ledger.gatewayProof.liveX402Receipt.amountUsdc,
      readTollUsdc: ledger.metrics.readTollUsdc,
      citationTollUsdc: ledger.metrics.citationTollUsdc,
      collaboratorSplitUsdc: Number(splitTotalUsdc.toFixed(6)),
      impactPoolUsdc: Number(impactTotalUsdc.toFixed(6)),
      creatorCashoutUsdc: ledger.metrics.creatorCashoutUsdc,
    },
    inflows: {
      readTolls: readTolls.slice(0, 10),
      citationTolls: citationTolls.slice(0, 10),
      liveGatewayReceipt: ledger.gatewayProof.liveX402Receipt,
    },
    outflows: {
      collaboratorSplits: ledger.payoutSplits.slice(0, 20),
      impactGrants: ledger.impactGrants.slice(0, 20),
      creatorCashouts: ledger.creatorCashouts.slice(0, 10),
    },
    controls: [
      "Citation toll settlement is capped by the buyer session's remaining budget.",
      "Impact grants are allocated only after citation receipts exist.",
      "Creator cash-outs aggregate existing split and impact balances instead of inventing payout volume.",
      "Public tester traction must pass GitHub issue gates before the score endpoint returns 100/100.",
    ],
  };
}

export function buildOpenApiDocument(origin = APP_URL) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Kleos API",
      version: "1.0.0",
      summary: "Agent-paid source inspection, citation settlement, creator operations, and proof APIs.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/status": { get: { summary: "Public operations status and judge proof links." } },
      "/api/health": { get: { summary: "Small health check for uptime monitors." } },
      "/api/treasury": { get: { summary: "Gateway, toll, split, impact, and cash-out treasury proof." } },
      "/api/agent-card": { get: { summary: "Kleos agent card with wallet, x402 schemes, services, tools, and proof links." } },
      "/api/catalog": { get: { summary: "Agent-readable priced content catalog." } },
      "/api/content/{id}": { get: { summary: "x402-protected content endpoint; unpaid requests return 402." } },
      "/api/registry/sources": { get: { summary: "Creator-scoped source registry records and split digests." } },
      "/api/vault/{id}": { get: { summary: "Encrypted content vault record with public ciphertext and post-payment key policy." } },
      "/api/vault/{id}/key": { post: { summary: "Release an encrypted content key after x402 payment proof." } },
      "/api/a2a/ask": { post: { summary: "x402-priced agent-to-agent grounded-answer run." } },
      "/api/agent/ask": { post: { summary: "Alias for x402-priced agent-to-agent grounded-answer runs." } },
      "/api/trial/sponsored": { post: { summary: "No-wallet sponsored trial that runs the inspect, cite, reward, reprice loop." } },
      "/api/agent/research": { post: { summary: "Budgeted buyer research agent." } },
      "/api/citations/finalize": { post: { summary: "Finalize an answer and settle citation tolls." } },
      "/api/answers/proof": { get: { summary: "Shareable answer proof with claim traces." } },
      "/api/receipts/verify": { get: { summary: "Latest receipt verification." }, post: { summary: "Verify a citation receipt." } },
      "/api/transparency/log": { get: { summary: "Append-only transparency log with root hash for payments, citations, splits, impact, cash-outs, and audits." } },
      "/api/transparency/proof/{id}": { get: { summary: "Inclusion proof for a transparency log entry." } },
      "/api/citations/challenge": { get: { summary: "Latest citation challenge." }, post: { summary: "Challenge weak citation support." } },
      "/api/impact/settle": { post: { summary: "Allocate sponsor impact pool to cited sources." } },
      "/api/impact/graph": { get: { summary: "Source-to-answer-to-creator impact graph with value-flow edges and proof hashes." } },
      "/api/webhooks/dispatch": { post: { summary: "Create signed creator webhook delivery records." } },
      "/api/creators/cashout": { post: { summary: "Queue Arc-ready creator cash-out batches." } },
      "/api/pricing/recompute": { post: { summary: "Run citation-aware seller repricing." } },
      "/api/traction/attest": { get: { summary: "Tester attestation instructions." }, post: { summary: "Mint tester proof hash and GitHub issue URL." } },
      "/api/traction/github": { get: { summary: "Verify durable public tester GitHub issues." } },
      "/api/tester/one-click": { get: { summary: "Hosted one-click tester instructions." }, post: { summary: "Run scenario, verify receipt, mint proof hash, and return public GitHub issue URL." } },
      "/api/mcp": { get: { summary: "MCP-style manifest for agent discovery and actions." } },
      "/api/mcp/rpc": { get: { summary: "MCP JSON-RPC endpoint metadata." }, post: { summary: "MCP JSON-RPC calls for tools/list, tools/call, resources/list, and resources/read." } },
      "/.well-known/mcp.json": { get: { summary: "Well-known MCP discovery document." } },
      "/.well-known/agent-card.json": { get: { summary: "Well-known Kleos agent service card." } },
      "/api/publisher-kit": { get: { summary: "Publisher manifest and crawler payment policy." } },
      "/api/oss-kit": { get: { summary: "Reusable integration kit for builders." } },
      "/api/proof-pack": { get: { summary: "Single judge proof pack." } },
      "/api/provenance": { get: { summary: "Submission certificate with deployment, CI, x402, score, and traction gates." } },
      "/api/submission/certificate": { get: { summary: "Judge-facing submission certificate alias for /api/provenance." } },
      "/api/competitive/positioning": { get: { summary: "Rubric score estimate with honest traction gates." } },
    },
  };
}
