import { publicOriginFromRequest } from "@/lib/kleos/request-origin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = publicOriginFromRequest(request);

  return Response.json(
    {
      name: "Kleos OSS Integration Kit",
      version: "0.2.0",
      purpose:
        "Copy-paste primitives for builders who want agent-paid read tolls, citation settlement, proof exports, creator webhooks, and cash-outs.",
      install: {
        catalog: `${origin}/api/catalog`,
        mcpManifest: `${origin}/api/mcp`,
        publisherManifest: `${origin}/api/publisher-kit`,
        sourceRegistry: `${origin}/api/registry/sources`,
        encryptedVault: `${origin}/api/vault/ci_arc_gateway_notes`,
        a2aAsk: `${origin}/api/a2a/ask`,
        answerProof: `${origin}/api/answers/proof`,
        tractionCampaign: `${origin}/api/traction/campaign`,
        durableGithubTraction: `${origin}/api/traction/github`,
      },
      agentFlow: [
        "GET /api/catalog to discover previews, prices, citation tolls, and splits.",
        "GET /api/content/:id without payment to receive a 402 challenge.",
        "Retry with PAYMENT-SIGNATURE after Circle Gateway authorization.",
        "GET /api/vault/:id to inspect public encrypted content, then POST /api/vault/:id/key after payment proof.",
        "POST /api/a2a/ask when another agent wants to buy a grounded answer from Kleos.",
        "POST /api/citations/finalize once an answer cites purchased sources.",
        "GET /api/answers/proof to export claim traces, receipts, payouts, and x402 proof.",
        "POST /api/webhooks/dispatch and /api/creators/cashout for creator operations.",
        "GET /api/traction/campaign for role-specific tester asks, curl payloads, and success gates.",
        "GET /api/traction/github to verify public tester-attestation issues as durable traction evidence.",
      ],
      curl: {
        catalog: `curl ${origin}/api/catalog`,
        challenge: `curl -i ${origin}/api/content/ci_arc_gateway_notes`,
        localProof: `curl -H "PAYMENT-SIGNATURE: kleos-payment-proof:ci_arc_gateway_notes:oss-kit" ${origin}/api/content/ci_arc_gateway_notes`,
        registry: `curl ${origin}/api/registry/sources`,
        vault: `curl ${origin}/api/vault/ci_arc_gateway_notes`,
        vaultKey: `curl -X POST -H "PAYMENT-SIGNATURE: kleos-payment-proof:ci_arc_gateway_notes:oss-kit" ${origin}/api/vault/ci_arc_gateway_notes/key`,
        a2aAsk: `curl -X POST -H "PAYMENT-SIGNATURE: kleos-payment-proof:a2a:oss-kit" ${origin}/api/a2a/ask -H "Content-Type: application/json" -d "{\\"question\\":\\"How should AI agents pay creators?\\"}"`,
        proof: `curl ${origin}/api/answers/proof`,
        campaign: `curl ${origin}/api/traction/campaign`,
        githubTraction: `curl ${origin}/api/traction/github`,
        attestation: `curl -X POST ${origin}/api/traction/attest -H "Content-Type: application/json" -d "{\\"testerName\\":\\"OSS tester\\",\\"quote\\":\\"Kleos proof flow worked.\\"}"`,
      },
      schemas: {
        citationReceipt:
          "answerHash, supportSpan, readPaymentId, citationPaymentId, receiptHash, confidence, citationTollUsdc",
        claimTrace:
          "claim, coveragePct, status, supportingItemIds, paidReadIds, citationReceiptIds, rationale",
        creatorWebhook:
          "eventType, targetUrl, payloadDigest, signature, status, attempts",
        sourceRegistry:
          "registryId, creatorScopedId, metadataCid, encryptedContentCid, splitDigest, splitBps, economics",
        vaultKeyRelease:
          "releaseId, itemId, algorithm, key, releaseProof, policy, createdAt",
        a2aSettlement:
          "payment, answerHash, settlementId, readTollUsdc, citationTollUsdc, citationReceipts, impactGrants",
        testerAttestation:
          "testerName, testerRole, scenarioRun, useful, quote, proofHash, githubIssueUrl",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
