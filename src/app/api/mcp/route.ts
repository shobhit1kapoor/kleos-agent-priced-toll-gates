import { getCatalogItems, getStore } from "@/lib/kleos/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();

  return Response.json({
    server: "Kleos-charon-mcp",
    version: "0.1.0",
    description:
      "MCP-compatible tool manifest for discovering, quoting, buying, and summarizing Kleos paid content.",
    rpcEndpoint: "/api/mcp/rpc",
    wellKnownDiscovery: "/.well-known/mcp.json",
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
        name: "list_source_registry",
        description:
          "Return creator-scoped source registry records, metadata/content CIDs, split digests, and Arc contract artifact mapping.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "import_rss_feed",
        description:
          "Fetch an RSS/Atom feed and register recent entries as x402-priced creator sources.",
        inputSchema: {
          type: "object",
          required: ["feedUrl"],
          properties: {
            feedUrl: { type: "string" },
            creatorName: { type: "string" },
            creatorWallet: { type: "string" },
            priceUsdc: { type: "number" },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "verify_publisher_ownership",
        description:
          "Issue or verify a publisher ownership challenge for a creator wallet and source domain.",
        inputSchema: {
          type: "object",
          required: ["creatorName", "wallet", "publisherUrl"],
          properties: {
            creatorName: { type: "string" },
            wallet: { type: "string" },
            publisherUrl: { type: "string" },
            feedUrl: { type: "string" },
            proofUrl: { type: "string" },
            proofText: { type: "string" },
            method: {
              type: "string",
              enum: ["well-known", "feed-proof", "manual-proof"],
            },
          },
        },
      },
      {
        name: "list_publisher_verifications",
        description:
          "Return publisher ownership challenges and verified creator/source owner records.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_encrypted_vault_item",
        description:
          "Return public ciphertext and x402-gated key-release policy for a paid creator source.",
        inputSchema: {
          type: "object",
          required: ["itemId"],
          properties: { itemId: { type: "string" } },
        },
      },
      {
        name: "release_vault_key",
        description:
          "Release an encrypted content key after the caller provides an x402 payment proof.",
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
        name: "ask_kleos_agent",
        description:
          "Pay Kleos over x402 for an agent-to-agent grounded-answer run that settles creator reads and citations.",
        inputSchema: {
          type: "object",
          required: ["question", "paymentSignature"],
          properties: {
            question: { type: "string" },
            budgetUsdc: { type: "number" },
            paymentSignature: { type: "string" },
          },
        },
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
        name: "verify_citation_receipt",
        description:
          "Independently verify receipt links, read and citation payments, split totals, and claim support.",
        inputSchema: {
          type: "object",
          properties: { receiptId: { type: "string" } },
        },
      },
      {
        name: "get_reputation_passport",
        description:
          "Return ERC-8004-ready local reputation passports for buyer agents, creators, publishers, and Kleos.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "create_reputation_attestation",
        description:
          "Append a signed local trust event to the Kleos reputation passport.",
        inputSchema: {
          type: "object",
          required: ["subject"],
          properties: {
            subject: { type: "string" },
            counterparty: { type: "string" },
            title: { type: "string" },
            note: { type: "string" },
            amountUsdc: { type: "number" },
          },
        },
      },
      {
        name: "challenge_citation",
        description:
          "Challenge a weak citation receipt and mark the broker bond at risk if support verification fails.",
        inputSchema: {
          type: "object",
          properties: {
            receiptId: { type: "string" },
            challenger: { type: "string" },
            challengeReason: { type: "string" },
            claimedWeakness: {
              type: "string",
              enum: ["unsupported_claim", "weak_support_span", "wrong_source", "split_mismatch"],
            },
          },
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
      {
        name: "get_traction_campaign",
        description:
          "Return role-specific tester asks, curl payloads, social copy, and success gates for closing the external traction gap.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "verify_github_traction",
        description:
          "Verify durable public tester attestations from GitHub issues labeled tester-attestation.",
        inputSchema: { type: "object", properties: {} },
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
      receiptVerifications: store.receiptVerifications.slice(0, 5),
      citationChallenges: store.citationChallenges.slice(0, 5),
      testerAttestations: store.testerAttestations.slice(0, 5),
      agentTrustEvents: store.agentTrustEvents.slice(0, 5),
      publisherVerifications: store.publisherVerifications.slice(0, 5),
    },
  });
}
