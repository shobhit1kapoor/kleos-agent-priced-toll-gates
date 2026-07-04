import type {
  CatalogItem,
  CitationChallenge,
  Collaborator,
  ContentItem,
  Creator,
  CreatorRole,
  KleosStore,
  ReceiptVerification,
} from "./types";
import {
  arcExplorerTxUrl,
  LIVE_X402_AMOUNT_USDC,
  LIVE_X402_PAYER,
  LIVE_X402_RECEIPT_ID,
} from "./config";

const now = () => new Date().toISOString();

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeShapeHash(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return `0x${Math.abs(hash).toString(16).padStart(64, "0").slice(0, 64)}`;
}

const creators: Creator[] = [
  {
    id: "cr_ada",
    displayName: "Ada Chen",
    role: "author",
    wallet: "0xada1000000000000000000000000000000000a11",
    reputation: 92,
  },
  {
    id: "cr_maya",
    displayName: "Maya Rao",
    role: "researcher",
    wallet: "0x0a20000000000000000000000000000000000b22",
    reputation: 88,
  },
  {
    id: "cr_noah",
    displayName: "Noah Kim",
    role: "editor",
    wallet: "0x0a30000000000000000000000000000000000c33",
    reputation: 81,
  },
  {
    id: "cr_civic",
    displayName: "Civic Ledger",
    role: "publisher",
    wallet: "0xc171c40000000000000000000000000000000d44",
    reputation: 95,
  },
];

const contentItems: ContentItem[] = [
  {
    id: "ci_arc_gateway_notes",
    title: "Circle Gateway Nanopayments: why sub-cent agent payments work",
    sourceUrl: "https://developers.circle.com/gateway/nanopayments",
    rssRoute: "/rsshub/circle/gateway/nanopayments",
    preview:
      "The core Circle source explaining gas-free USDC nanopayments, Gateway batching, and the buyer-seller flow Kleos builds on.",
    fullContent:
      "Kleos-curated memo: Circle Gateway is the economic reason an agent can pay a fraction of a cent for creator content. The buyer funds Gateway once, receives a 402 challenge from a paid resource, signs an offchain authorization, retries with proof of payment, and lets Gateway batch settlement later. For judges, this source supports the claim that Kleos is not a conventional paywall; it is a high-frequency agent commerce rail where the HTTP request itself becomes the payment negotiation.",
    currentPriceUsdc: 0.004,
    citationPriceUsdc: 0.0014,
    minPriceUsdc: 0.001,
    maxPriceUsdc: 0.025,
    freshnessScore: 96,
    credibilityScore: 91,
    tags: ["circle", "gateway", "nanopayments", "usdc"],
  },
  {
    id: "ci_rss_creator_tolls",
    title: "RSSHub: the machine-readable chokepoint for creator feeds",
    sourceUrl: "https://github.com/DIYgod/RSSHub",
    rssRoute: "/rsshub/github/DIYgod/RSSHub",
    preview:
      "RSSHub is the practical ingestion surface for Kleos because it turns many independent sites into consistent agent-readable feeds.",
    fullContent:
      "Kleos-curated memo: RSSHub is valuable because it gives Charon a natural place to wrap content without asking every creator to install a custom CMS plugin. The agent can inspect feed metadata, compare source previews, and pay only when it needs the full item. This source makes the distribution strategy concrete: start with RSS-like surfaces, not broad web scraping.",
    currentPriceUsdc: 0.0032,
    citationPriceUsdc: 0.0011,
    minPriceUsdc: 0.001,
    maxPriceUsdc: 0.018,
    freshnessScore: 89,
    credibilityScore: 87,
    tags: ["rss", "rsshub", "creator", "ingestion"],
  },
  {
    id: "ci_dynamic_pricing_agents",
    title: "x402: the HTTP negotiation layer for Charon tolls",
    sourceUrl: "https://developers.circle.com/gateway/nanopayments/concepts/x402",
    rssRoute: "/rsshub/circle/gateway/x402",
    preview:
      "Circle's x402 explainer is the clearest source for Kleos's 402 challenge, PAYMENT-SIGNATURE retry, and PAYMENT-RESPONSE receipt.",
    fullContent:
      "Kleos-curated memo: x402 turns payment into a web-native negotiation. A seller responds to an unpaid request with payment requirements, the buyer chooses a supported scheme, signs a payment payload, and retries. Charon uses this pattern for content: previews remain visible, but full text requires a valid payment signal. This source explains why Kleos uses HTTP 402 instead of a login wall or subscription checkout.",
    currentPriceUsdc: 0.006,
    citationPriceUsdc: 0.0021,
    minPriceUsdc: 0.002,
    maxPriceUsdc: 0.03,
    freshnessScore: 93,
    credibilityScore: 89,
    tags: ["x402", "http", "payment-signature", "charon"],
  },
  {
    id: "ci_collaborator_splits",
    title: "Arc Nanopayments reference app: buyer agent plus seller endpoints",
    sourceUrl: "https://github.com/circlefin/arc-nanopayments",
    rssRoute: "/rsshub/github/circlefin/arc-nanopayments",
    preview:
      "The most important sample repo for Kleos: a working buyer agent, x402-protected seller endpoints, Gateway batching, and seller dashboard patterns.",
    fullContent:
      "Kleos-curated memo: the Arc Nanopayments repo is the implementation anchor because it already demonstrates the two-sided shape Kleos needs: a paying agent on one side, protected resources on the other, and a seller-facing view of payments. Kleos extends that base concept with live seller pricing, content-specific catalogs, buyer budget decisions, and collaborator splits.",
    currentPriceUsdc: 0.0055,
    citationPriceUsdc: 0.0019,
    minPriceUsdc: 0.001,
    maxPriceUsdc: 0.022,
    freshnessScore: 84,
    credibilityScore: 93,
    tags: ["reference-app", "langchain", "gateway", "seller"],
  },
  {
    id: "ci_agent_reputation",
    title: "ERC-8004: reputation hooks for agent-to-agent markets",
    sourceUrl: "https://eips.ethereum.org/EIPS/eip-8004",
    rssRoute: "/rsshub/eips/erc-8004",
    preview:
      "The draft trustless-agent standard Kleos can map to for portable buyer and seller reputation.",
    fullContent:
      "Kleos-curated memo: ERC-8004 is useful as a direction for portable agent identity, reputation, and validation, but Kleos should not depend on it for core settlement. The practical implementation keeps local buyer reputation today and maps it into an ERC-8004 adapter later. That keeps the product shippable while still making agent-to-agent reputation economically meaningful through toll discounts.",
    currentPriceUsdc: 0.007,
    citationPriceUsdc: 0.0025,
    minPriceUsdc: 0.002,
    maxPriceUsdc: 0.035,
    freshnessScore: 90,
    credibilityScore: 85,
    tags: ["erc-8004", "reputation", "agent-to-agent", "trust"],
  },
  {
    id: "ci_hackathon_judge_path",
    title: "Canteen distribution bootstrap: start where audiences already are",
    sourceUrl:
      "https://thecanteenapp.com/analysis/2026/05/28/distribution-bootstrap-payments-founders.html",
    rssRoute: "/rsshub/canteen/distribution-bootstrap",
    preview:
      "The strategic source behind Kleos's RSS/articles-first distribution plan and traction story.",
    fullContent:
      "Kleos-curated memo: Canteen's distribution thesis says payment founders should not start with abstract rails and no audience. Kleos follows that advice by wrapping content surfaces that already have readers, feeds, metadata, and communities. This source strengthens the submission because it explains why the product starts with creator RSS/article flows instead of a generic payment dashboard.",
    currentPriceUsdc: 0.0028,
    citationPriceUsdc: 0.001,
    minPriceUsdc: 0.001,
    maxPriceUsdc: 0.02,
    freshnessScore: 98,
    credibilityScore: 90,
    tags: ["distribution", "traction", "creator", "canteen"],
  },
  {
    id: "ci_arc_cli_project_updates",
    title: "ARC CLI: project tracking and Arc builder context",
    sourceUrl: "https://github.com/the-canteen-dev/ARC-cli",
    rssRoute: "/rsshub/github/the-canteen-dev/ARC-cli",
    preview:
      "The Canteen CLI source that helps builders log product and traction updates and pull Arc/Circle context into agent workflows.",
    fullContent:
      "Kleos-curated memo: ARC CLI matters because Lepton judging rewards real traction and clear progress, not only code. The CLI gives builders a way to authenticate, inspect status, post product updates, post traction updates, and sync Arc/Circle developer context. Kleos uses this source to explain its submission workflow: build the rail, show the ledger, then keep the project and traction record visible.",
    currentPriceUsdc: 0.0036,
    citationPriceUsdc: 0.0012,
    minPriceUsdc: 0.001,
    maxPriceUsdc: 0.02,
    freshnessScore: 94,
    credibilityScore: 88,
    tags: ["arc-cli", "canteen", "traction", "developer-context"],
  },
];

const collaborators: Collaborator[] = [
  { id: "co_1", itemId: "ci_arc_gateway_notes", creatorId: "cr_ada", splitBps: 6000 },
  { id: "co_2", itemId: "ci_arc_gateway_notes", creatorId: "cr_maya", splitBps: 2500 },
  { id: "co_3", itemId: "ci_arc_gateway_notes", creatorId: "cr_civic", splitBps: 1500 },
  { id: "co_4", itemId: "ci_rss_creator_tolls", creatorId: "cr_noah", splitBps: 5000 },
  { id: "co_5", itemId: "ci_rss_creator_tolls", creatorId: "cr_civic", splitBps: 5000 },
  { id: "co_6", itemId: "ci_dynamic_pricing_agents", creatorId: "cr_ada", splitBps: 5500 },
  { id: "co_7", itemId: "ci_dynamic_pricing_agents", creatorId: "cr_noah", splitBps: 4500 },
  { id: "co_8", itemId: "ci_collaborator_splits", creatorId: "cr_maya", splitBps: 5000 },
  { id: "co_9", itemId: "ci_collaborator_splits", creatorId: "cr_noah", splitBps: 3000 },
  { id: "co_10", itemId: "ci_collaborator_splits", creatorId: "cr_civic", splitBps: 2000 },
  { id: "co_11", itemId: "ci_agent_reputation", creatorId: "cr_ada", splitBps: 4000 },
  { id: "co_12", itemId: "ci_agent_reputation", creatorId: "cr_maya", splitBps: 4000 },
  { id: "co_13", itemId: "ci_agent_reputation", creatorId: "cr_civic", splitBps: 2000 },
  { id: "co_14", itemId: "ci_hackathon_judge_path", creatorId: "cr_noah", splitBps: 7000 },
  { id: "co_15", itemId: "ci_hackathon_judge_path", creatorId: "cr_civic", splitBps: 3000 },
  { id: "co_16", itemId: "ci_arc_cli_project_updates", creatorId: "cr_ada", splitBps: 3000 },
  { id: "co_17", itemId: "ci_arc_cli_project_updates", creatorId: "cr_noah", splitBps: 3000 },
  { id: "co_18", itemId: "ci_arc_cli_project_updates", creatorId: "cr_civic", splitBps: 4000 },
];

const seedAnswer =
  "Kleos settles grounded AI answers by charging buyer agents to inspect creator sources, charging citation tolls only when those sources appear in the final answer, splitting each toll to collaborators, and repricing future access from answer impact.";
const seedAnswerHash = makeShapeHash(`seed:${seedAnswer}`);
const seedReceiptHash = makeShapeHash(`${seedAnswerHash}:ci_arc_gateway_notes:pay_seed_citation_gateway`);
const seedSettlementHash = makeShapeHash(`${seedAnswerHash}:ci_arc_gateway_notes:0.0014`);
const seedReceiptVerification: ReceiptVerification = {
  id: "verify_seed_gateway",
  targetType: "citation_receipt",
  targetId: "cite_seed_gateway",
  status: "valid",
  proofHash: makeShapeHash(`verify:${seedReceiptHash}:${LIVE_X402_RECEIPT_ID}`),
  checks: [
    {
      label: "answer hash linked",
      status: "pass",
      details: "Seed answer settlement contains the cited answer hash.",
    },
    {
      label: "read payment exists",
      status: "pass",
      details: "Live Circle CLI x402 read payment unlocked the source first.",
    },
    {
      label: "citation payment exists",
      status: "pass",
      details: "Citation payment settled a second-stage citation toll.",
    },
    {
      label: "collaborator basis points",
      status: "pass",
      details: "Collaborator splits sum to 10,000 basis points.",
    },
    {
      label: "citation split total",
      status: "pass",
      details: "Citation split total matches the citation payment amount.",
    },
    {
      label: "claim trace",
      status: "pass",
      details: "Claim trace marks the Gateway citation as covered.",
    },
  ],
  createdAt: now(),
};
const seedCitationChallenge: CitationChallenge = {
  id: "challenge_seed_gateway",
  receiptId: "cite_seed_gateway",
  sessionId: "sess_seed_live_gateway",
  itemId: "ci_arc_gateway_notes",
  challenger: "seeded-verifier-agent",
  challengeReason: "Cold-start proof that strong citations survive adversarial review.",
  claimedWeakness: "weak_support_span",
  status: "rejected",
  bondImpactUsdc: 0,
  buyerReputationDelta: 1,
  evaluatorRationale:
    "Challenge rejected: the live Gateway read payment, citation receipt, split totals, and claim trace all verify.",
  proofHash: makeShapeHash(`challenge:${seedReceiptHash}:rejected`),
  createdAt: now(),
};

const initialStore = (): KleosStore => ({
  creators,
  contentItems,
  collaborators,
  agentSessions: [
    {
      id: "sess_seed_live_gateway",
      buyerWallet: LIVE_X402_PAYER,
      buyerReputation: 94,
      task: "Explain Kleos as the settlement layer for grounded AI answers.",
      budgetUsdc: 0.018,
      spentUsdc: Number((LIVE_X402_AMOUNT_USDC + 0.0014).toFixed(6)),
      result: seedAnswer,
      answerHash: seedAnswerHash,
      citationFinalizedAt: now(),
      brokerBondUsdc: 0.0025,
      bondStatus: "released",
      createdAt: now(),
    },
  ],
  pricingEvents: [
    {
      id: "pe_seed",
      itemId: "ci_dynamic_pricing_agents",
      oldPriceUsdc: 0.005,
      newPriceUsdc: 0.006,
      reason: "Seeded demand signal: pricing-agent article converted during setup.",
      createdAt: now(),
    },
  ],
  purchaseAttempts: [
    {
      id: "pa_seed_paid_gateway",
      sessionId: "sess_seed_live_gateway",
      itemId: "ci_arc_gateway_notes",
      quotedPriceUsdc: LIVE_X402_AMOUNT_USDC,
      decision: "paid",
      reason: "Live Circle CLI x402 paid request settled through GatewayWalletBatched.",
      createdAt: now(),
    },
    {
      id: "pa_seed_paid_rss",
      sessionId: "sess_seed_live_gateway",
      itemId: "ci_rss_creator_tolls",
      quotedPriceUsdc: 0.0032,
      decision: "paid",
      reason: "Buyer agent bought the RSS distribution source for creator onboarding evidence.",
      createdAt: now(),
    },
    {
      id: "pa_seed_skipped_x402",
      sessionId: "sess_seed_live_gateway",
      itemId: "ci_dynamic_pricing_agents",
      quotedPriceUsdc: 0.006,
      decision: "skipped",
      reason: "Buyer agent preserved budget because the answer already had enough Gateway and RSS evidence.",
      createdAt: now(),
    },
  ],
  payments: [
    {
      id: "pay_seed_live_gateway",
      sessionId: "sess_seed_live_gateway",
      itemId: "ci_arc_gateway_notes",
      kind: "read",
      amountUsdc: LIVE_X402_AMOUNT_USDC,
      paymentSignature: "circle-cli-live-x402",
      settlementStatus: "settled",
      gatewayTransferId: LIVE_X402_RECEIPT_ID,
      explorerUrl: arcExplorerTxUrl(LIVE_X402_RECEIPT_ID),
      createdAt: now(),
      payer: LIVE_X402_PAYER,
      liveGatewayTx: LIVE_X402_RECEIPT_ID,
    },
    {
      id: "pay_seed_citation_gateway",
      sessionId: "sess_seed_live_gateway",
      itemId: "ci_arc_gateway_notes",
      kind: "citation",
      amountUsdc: 0.0014,
      paymentSignature: "kleos-payment-proof:seed:citation",
      settlementStatus: "batched",
      gatewayTransferId: "gw_seed_citation_gateway",
      explorerUrl: arcExplorerTxUrl(makeShapeHash("pay_seed_citation_gateway")),
      createdAt: now(),
      payer: LIVE_X402_PAYER,
    },
  ],
  payoutSplits: [
    {
      id: "split_seed_read_ada",
      paymentId: "pay_seed_live_gateway",
      creatorId: "cr_ada",
      amountUsdc: Number((LIVE_X402_AMOUNT_USDC * 0.6).toFixed(6)),
      splitBps: 6000,
      txHash: makeShapeHash("split_seed_read_ada"),
      explorerUrl: arcExplorerTxUrl(makeShapeHash("split_seed_read_ada")),
    },
    {
      id: "split_seed_read_maya",
      paymentId: "pay_seed_live_gateway",
      creatorId: "cr_maya",
      amountUsdc: Number((LIVE_X402_AMOUNT_USDC * 0.25).toFixed(6)),
      splitBps: 2500,
      txHash: makeShapeHash("split_seed_read_maya"),
      explorerUrl: arcExplorerTxUrl(makeShapeHash("split_seed_read_maya")),
    },
    {
      id: "split_seed_read_civic",
      paymentId: "pay_seed_live_gateway",
      creatorId: "cr_civic",
      amountUsdc: Number((LIVE_X402_AMOUNT_USDC * 0.15).toFixed(6)),
      splitBps: 1500,
      txHash: makeShapeHash("split_seed_read_civic"),
      explorerUrl: arcExplorerTxUrl(makeShapeHash("split_seed_read_civic")),
    },
    {
      id: "split_seed_cite_ada",
      paymentId: "pay_seed_citation_gateway",
      creatorId: "cr_ada",
      amountUsdc: 0.00084,
      splitBps: 6000,
      txHash: makeShapeHash("split_seed_cite_ada"),
      explorerUrl: arcExplorerTxUrl(makeShapeHash("split_seed_cite_ada")),
    },
    {
      id: "split_seed_cite_maya",
      paymentId: "pay_seed_citation_gateway",
      creatorId: "cr_maya",
      amountUsdc: 0.00035,
      splitBps: 2500,
      txHash: makeShapeHash("split_seed_cite_maya"),
      explorerUrl: arcExplorerTxUrl(makeShapeHash("split_seed_cite_maya")),
    },
    {
      id: "split_seed_cite_civic",
      paymentId: "pay_seed_citation_gateway",
      creatorId: "cr_civic",
      amountUsdc: 0.00021,
      splitBps: 1500,
      txHash: makeShapeHash("split_seed_cite_civic"),
      explorerUrl: arcExplorerTxUrl(makeShapeHash("split_seed_cite_civic")),
    },
  ],
  citationReceipts: [
    {
      id: "cite_seed_gateway",
      sessionId: "sess_seed_live_gateway",
      itemId: "ci_arc_gateway_notes",
      answerHash: seedAnswerHash,
      supportSpan:
        "Kleos-curated memo: Circle Gateway is the economic reason an agent can pay a fraction of a cent for creator content.",
      readPaymentId: "pay_seed_live_gateway",
      citationPaymentId: "pay_seed_citation_gateway",
      paymentId: "pay_seed_citation_gateway",
      citationHash: makeShapeHash(`${seedAnswerHash}:ci_arc_gateway_notes`),
      receiptHash: seedReceiptHash,
      claim: "Gateway batching makes sub-cent agent citation payments economically viable.",
      confidence: 94,
      impactScore: 93,
      citationTollUsdc: 0.0014,
      amountUsdc: 0.0014,
      settlementStatus: "batched",
      createdAt: now(),
    },
  ],
  answerSettlements: [
    {
      id: "ans_seed_live_gateway",
      sessionId: "sess_seed_live_gateway",
      answer: seedAnswer,
      answerHash: seedAnswerHash,
      readTollUsdc: LIVE_X402_AMOUNT_USDC,
      citationTollUsdc: 0.0014,
      citedItemIds: ["ci_arc_gateway_notes"],
      skippedPurchasedItemIds: ["ci_rss_creator_tolls"],
      remainingBudgetUsdc: Number((0.018 - LIVE_X402_AMOUNT_USDC - 0.0014).toFixed(6)),
      brokerBondUsdc: 0.0025,
      bondStatus: "released",
      receiptHash: seedSettlementHash,
      createdAt: now(),
    },
  ],
  impactGrants: [
    {
      id: "impact_seed_ada",
      settlementId: "ans_seed_live_gateway",
      receiptId: "cite_seed_gateway",
      itemId: "ci_arc_gateway_notes",
      creatorId: "cr_ada",
      sourceTitle: "Circle Gateway Nanopayments: why sub-cent agent payments work",
      amountUsdc: 0.0036,
      impactScore: 93,
      reason: "Seeded judge proof: live Gateway source was cited with high confidence.",
      txHash: makeShapeHash("impact_seed_ada"),
      explorerUrl: arcExplorerTxUrl(makeShapeHash("impact_seed_ada")),
      createdAt: now(),
    },
    {
      id: "impact_seed_maya",
      settlementId: "ans_seed_live_gateway",
      receiptId: "cite_seed_gateway",
      itemId: "ci_arc_gateway_notes",
      creatorId: "cr_maya",
      sourceTitle: "Circle Gateway Nanopayments: why sub-cent agent payments work",
      amountUsdc: 0.0015,
      impactScore: 93,
      reason: "Seeded judge proof: research collaborator receives impact-pool upside.",
      txHash: makeShapeHash("impact_seed_maya"),
      explorerUrl: arcExplorerTxUrl(makeShapeHash("impact_seed_maya")),
      createdAt: now(),
    },
  ],
  creatorWebhooks: creators.map((creator) => ({
    id: `wh_${creator.id}`,
    creatorId: creator.id,
    url: `https://webhook.site/kleos/${creator.id}`,
    secretHash: makeShapeHash(`kleos-webhook-secret:${creator.id}`),
    eventTypes: ["citation.settled", "impact.settled", "cashout.created"],
    status: "active",
    createdAt: now(),
  })),
  webhookDeliveries: [
    {
      id: "whd_seed_ada",
      webhookId: "wh_cr_ada",
      creatorId: "cr_ada",
      eventType: "citation.settled",
      targetUrl: "https://webhook.site/kleos/cr_ada",
      payloadDigest: makeShapeHash("whd_seed_ada_payload"),
      signature: makeShapeHash("whd_seed_ada_signature"),
      status: "signed_queued",
      attempts: 1,
      createdAt: now(),
    },
  ],
  creatorCashouts: [
    {
      id: "cashout_seed_ada",
      creatorId: "cr_ada",
      amountUsdc: Number((LIVE_X402_AMOUNT_USDC * 0.6 + 0.00084 + 0.0036).toFixed(6)),
      sourceCount: 1,
      status: "queued_arc_settlement",
      txHash: makeShapeHash("cashout_seed_ada"),
      explorerUrl: arcExplorerTxUrl(makeShapeHash("cashout_seed_ada")),
      createdAt: now(),
    },
  ],
  claimTraces: [
    {
      id: "claim_seed_gateway",
      sessionId: "sess_seed_live_gateway",
      claim: "Kleos settles grounded AI answers with read tolls, citation tolls, collaborator splits, and impact-aware repricing.",
      coveragePct: 92,
      status: "covered",
      supportingItemIds: ["ci_arc_gateway_notes"],
      paidReadIds: ["pay_seed_live_gateway"],
      citationReceiptIds: ["cite_seed_gateway"],
      rationale: "Seeded judge proof is backed by the live Gateway read payment and citation receipt.",
    },
  ],
  testerAttestations: [],
  receiptVerifications: [seedReceiptVerification],
  citationChallenges: [seedCitationChallenge],
  agentTrustEvents: [
    {
      id: "ate_shadow_float_v2",
      title: "Shadow Float V2 sponsored spend intent",
      network: "Arc Testnet",
      status: "signed_bound",
      amountUsdc: 0.01,
      agent: "0xd39AcD18d4aB66f31e3f1931953374d4a546ABA3",
      counterparty: "0x8ddf06fE8985988d3e0883F945E891BD57084937",
      contractAddress: "0x20dcA96B0C487D94De885c726c956ffaF38b12C2",
      digest: "0x385da6598ecf182bd4ceecd28fa55e43116e978255336b9b505cfbb1e3ca452b",
      note:
        "Kleos signer authorized a bounded 0.01 USDC provider spend; Shadow Float bound it onchain with repayment intentionally pending until after judging.",
      createdAt: now(),
    },
  ],
});

declare global {
  var __kleosStore: KleosStore | undefined;
}

function ensureStoreShape(store: KleosStore) {
  store.answerSettlements ??= [];
  store.citationReceipts ??= [];
  store.impactGrants ??= [];
  store.creatorWebhooks ??= [];
  store.webhookDeliveries ??= [];
  store.creatorCashouts ??= [];
  store.claimTraces ??= [];
  store.testerAttestations ??= [];
  store.receiptVerifications ??= [];
  store.citationChallenges ??= [];

  for (const creator of store.creators) {
    if (!store.creatorWebhooks.some((webhook) => webhook.creatorId === creator.id)) {
      store.creatorWebhooks.push({
        id: `wh_${creator.id}`,
        creatorId: creator.id,
        url: `https://webhook.site/kleos/${creator.id}`,
        secretHash: makeShapeHash(`kleos-webhook-secret:${creator.id}`),
        eventTypes: ["citation.settled", "impact.settled", "cashout.created"],
        status: "active",
        createdAt: now(),
      });
    }
  }

  for (const item of store.contentItems) {
    item.citationPriceUsdc ??= Math.max(
      0.000001,
      Number((item.currentPriceUsdc * 0.35).toFixed(6)),
    );
  }

  for (const payment of store.payments) {
    payment.kind ??= "read";
  }

  for (const receipt of store.citationReceipts) {
    const readPayment =
      store.payments.find((payment) => payment.id === receipt.readPaymentId) ??
      store.payments.find((payment) => payment.id === receipt.paymentId);
    const citationPayment =
      store.payments.find((payment) => payment.id === receipt.citationPaymentId) ??
      store.payments.find((payment) => payment.id === receipt.paymentId);
    const item = store.contentItems.find((entry) => entry.id === receipt.itemId);

    receipt.answerHash ??= makeShapeHash(`${receipt.sessionId}:${receipt.claim}`);
    receipt.supportSpan ??= item?.fullContent.split(". ").find(Boolean) ?? receipt.claim;
    receipt.readPaymentId ??= readPayment?.id ?? receipt.paymentId;
    receipt.citationPaymentId ??= citationPayment?.id ?? receipt.paymentId;
    receipt.receiptHash ??= makeShapeHash(`${receipt.answerHash}:${receipt.itemId}:${receipt.paymentId}`);
    receipt.citationTollUsdc ??= receipt.amountUsdc;
    receipt.settlementStatus ??= citationPayment?.settlementStatus ?? "batched";
  }
}

export function getStore(): KleosStore {
  globalThis.__kleosStore ??= initialStore();
  ensureStoreShape(globalThis.__kleosStore);
  return globalThis.__kleosStore;
}

export function getCatalogItems(): CatalogItem[] {
  const store = getStore();

  return store.contentItems.map((item) => ({
    ...item,
    collaborators: store.collaborators
      .filter((collaborator) => collaborator.itemId === item.id)
      .map((collaborator) => {
        const creator = store.creators.find((entry) => entry.id === collaborator.creatorId);
        if (!creator) {
          throw new Error(`Missing creator for collaborator ${collaborator.id}`);
        }

        return { ...creator, splitBps: collaborator.splitBps };
      }),
  }));
}

export function getContentItem(itemId: string): ContentItem | undefined {
  return getStore().contentItems.find((item) => item.id === itemId);
}

export function registerContentSource(input: {
  title: string;
  sourceUrl: string;
  preview: string;
  priceUsdc: number;
  creatorName: string;
  creatorWallet?: string;
  role?: CreatorRole;
  rssRoute?: string;
  fullContent?: string;
  tags?: string[];
  freshnessScore?: number;
  credibilityScore?: number;
}) {
  const store = getStore();
  const price = Number(input.priceUsdc.toFixed(6));
  const creatorId = makeId("cr");
  const itemId = makeId("ci");

  store.creators.unshift({
    id: creatorId,
    displayName: input.creatorName,
    role: input.role ?? "author",
    wallet:
      input.creatorWallet?.trim() ||
      `0x${creatorId.replace(/[^a-f0-9]/gi, "").padEnd(40, "0").slice(0, 40)}`,
    reputation: 72,
  });

  store.contentItems.unshift({
    id: itemId,
    title: input.title.trim(),
    sourceUrl: input.sourceUrl.trim(),
    rssRoute: input.rssRoute?.trim() || `/rsshub/kleos/registered/${itemId}`,
    preview: input.preview.trim(),
    fullContent:
      input.fullContent?.trim() ||
      `Kleos registered source memo: ${input.title.trim()} was added through the creator intake flow. Buyer agents can quote the preview, pay the x402 toll, and attach citation receipts when this source grounds an answer.`,
    currentPriceUsdc: Math.max(0.000001, price),
    citationPriceUsdc: Math.max(0.000001, Number((price * 0.35).toFixed(6))),
    minPriceUsdc: Math.max(0.000001, Number((price * 0.5).toFixed(6))),
    maxPriceUsdc: Math.max(0.000002, Number((price * 4).toFixed(6))),
    freshnessScore: input.freshnessScore ?? 82,
    credibilityScore: input.credibilityScore ?? 76,
    tags: input.tags ?? ["registered-source", "creator", "citation"],
  });

  store.collaborators.unshift({
    id: makeId("co"),
    itemId,
    creatorId,
    splitBps: 10000,
  });

  store.creatorWebhooks.unshift({
    id: `wh_${creatorId}`,
    creatorId,
    url: `https://webhook.site/kleos/${creatorId}`,
    secretHash: makeShapeHash(`kleos-webhook-secret:${creatorId}`),
    eventTypes: ["citation.settled", "impact.settled", "cashout.created"],
    status: "active",
    createdAt: now(),
  });

  return getCatalogItems().find((item) => item.id === itemId);
}
