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
        answerProof: `${origin}/api/answers/proof`,
      },
      agentFlow: [
        "GET /api/catalog to discover previews, prices, citation tolls, and splits.",
        "GET /api/content/:id without payment to receive a 402 challenge.",
        "Retry with PAYMENT-SIGNATURE after Circle Gateway authorization.",
        "POST /api/citations/finalize once an answer cites purchased sources.",
        "GET /api/answers/proof to export claim traces, receipts, payouts, and x402 proof.",
        "POST /api/webhooks/dispatch and /api/creators/cashout for creator operations.",
      ],
      curl: {
        catalog: `curl ${origin}/api/catalog`,
        challenge: `curl -i ${origin}/api/content/ci_arc_gateway_notes`,
        localProof: `curl -H "PAYMENT-SIGNATURE: kleos-payment-proof:ci_arc_gateway_notes:oss-kit" ${origin}/api/content/ci_arc_gateway_notes`,
        proof: `curl ${origin}/api/answers/proof`,
        attestation: `curl -X POST ${origin}/api/traction/attest -H "Content-Type: application/json" -d "{\\"testerName\\":\\"OSS tester\\",\\"quote\\":\\"Kleos proof flow worked.\\"}"`,
      },
      schemas: {
        citationReceipt:
          "answerHash, supportSpan, readPaymentId, citationPaymentId, receiptHash, confidence, citationTollUsdc",
        claimTrace:
          "claim, coveragePct, status, supportingItemIds, paidReadIds, citationReceiptIds, rationale",
        creatorWebhook:
          "eventType, targetUrl, payloadDigest, signature, status, attempts",
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
