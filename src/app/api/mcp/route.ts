import { getCatalogItems, getStore } from "@/lib/kleos/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();

  return Response.json({
    server: "Kleos-charon-mcp",
    version: "0.1.0",
    description:
      "MCP-compatible tool manifest for discovering, quoting, buying, and summarizing Kleos paid content.",
    tools: [
      {
        name: "list_paid_sources",
        description: "List priced creator content exposed by Charon Gateway.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "quote_source",
        description: "Return current x402 toll and collaborator splits for a content item.",
        inputSchema: {
          type: "object",
          required: ["itemId"],
          properties: { itemId: { type: "string" } },
        },
      },
      {
        name: "buy_source",
        description: "Buy a source through the x402 PAYMENT-SIGNATURE flow.",
        inputSchema: {
          type: "object",
          required: ["itemId", "paymentSignature"],
          properties: {
            itemId: { type: "string" },
            paymentSignature: { type: "string" },
          },
        },
      },
      {
        name: "summarize_purchases",
        description: "Summarize paid, skipped, and challenged attempts for a buyer-agent session.",
        inputSchema: {
          type: "object",
          properties: { sessionId: { type: "string" } },
        },
      },
      {
        name: "finalize_answer_citations",
        description:
          "Finalize an answer, charge citation tolls only for cited paid sources, and mint answer-linked receipts.",
        inputSchema: {
          type: "object",
          required: ["sessionId", "answer"],
          properties: {
            sessionId: { type: "string" },
            answer: { type: "string" },
            maxCitationSpendUsdc: { type: "number" },
          },
        },
      },
      {
        name: "list_citation_receipts",
        description: "List answer hashes, support spans, citation payments, and split outcomes.",
        inputSchema: {
          type: "object",
          properties: { sessionId: { type: "string" } },
        },
      },
      {
        name: "settle_impact_pool",
        description:
          "Allocate sponsor capital retroactively to cited sources after answer settlement proves impact.",
        inputSchema: {
          type: "object",
          properties: {
            settlementId: { type: "string" },
            sponsorPoolUsdc: { type: "number" },
          },
        },
      },
      {
        name: "get_publisher_kit",
        description:
          "Return the Kleos publisher manifest, crawler policy, and RSS/Ghost mapping for creator onboarding.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_oss_kit",
        description:
          "Return copy-paste integration steps for agents, publishers, proof exports, webhooks, cash-outs, and tester attestations.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_answer_proof",
        description:
          "Return a shareable proof package with claim traces, citation receipts, creator payouts, webhooks, and live x402 proof.",
        inputSchema: {
          type: "object",
          properties: { settlementId: { type: "string" } },
        },
      },
      {
        name: "dispatch_creator_webhooks",
        description:
          "Queue signed creator webhook payloads for cited-source, impact, or cash-out events.",
        inputSchema: {
          type: "object",
          properties: {
            settlementId: { type: "string" },
            eventType: {
              type: "string",
              enum: ["citation.settled", "impact.settled", "cashout.created"],
            },
          },
        },
      },
      {
        name: "create_creator_cashouts",
        description:
          "Aggregate creator split and impact balances into Arc-ready cash-out records.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "create_tester_attestation",
        description:
          "Mint a signed tester proof hash and prefilled GitHub issue URL after a public scenario run.",
        inputSchema: {
          type: "object",
          properties: {
            testerName: { type: "string" },
            testerRole: {
              type: "string",
              enum: ["judge", "creator", "builder", "agent-operator", "other"],
            },
            quote: { type: "string" },
          },
        },
      },
    ],
    resources: getCatalogItems().map((item) => ({
      uri: `kleos://content/${item.id}`,
      name: item.title,
      mimeType: "text/markdown",
      metadata: {
        preview: item.preview,
        priceUsdc: item.currentPriceUsdc,
        citationPriceUsdc: item.citationPriceUsdc ?? Number((item.currentPriceUsdc * 0.35).toFixed(6)),
        tags: item.tags,
      },
    })),
    recentSignals: {
      pricingEvents: store.pricingEvents.slice(0, 5),
      purchaseAttempts: store.purchaseAttempts.slice(0, 5),
      citationReceipts: store.citationReceipts.slice(0, 5),
      answerSettlements: store.answerSettlements.slice(0, 3),
      impactGrants: store.impactGrants.slice(0, 5),
      webhookDeliveries: store.webhookDeliveries.slice(0, 5),
      creatorCashouts: store.creatorCashouts.slice(0, 5),
      claimTraces: store.claimTraces.slice(0, 5),
      testerAttestations: store.testerAttestations.slice(0, 5),
    },
  });
}
