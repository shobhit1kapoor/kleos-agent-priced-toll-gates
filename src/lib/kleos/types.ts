export type CreatorRole = "author" | "editor" | "researcher" | "publisher";

export type Creator = {
  id: string;
  displayName: string;
  role: CreatorRole;
  wallet: string;
  reputation: number;
};

export type ContentItem = {
  id: string;
  title: string;
  sourceUrl: string;
  rssRoute: string;
  preview: string;
  fullContent: string;
  currentPriceUsdc: number;
  citationPriceUsdc?: number;
  minPriceUsdc: number;
  maxPriceUsdc: number;
  freshnessScore: number;
  credibilityScore: number;
  tags: string[];
};

export type Collaborator = {
  id: string;
  itemId: string;
  creatorId: string;
  splitBps: number;
};

export type AgentSession = {
  id: string;
  buyerWallet: string;
  buyerReputation: number;
  task: string;
  budgetUsdc: number;
  spentUsdc: number;
  result: string;
  answerHash?: string;
  citationFinalizedAt?: string;
  brokerBondUsdc?: number;
  bondStatus?: "not_posted" | "posted" | "at_risk" | "released";
  createdAt: string;
};

export type PricingEvent = {
  id: string;
  itemId: string;
  oldPriceUsdc: number;
  newPriceUsdc: number;
  reason: string;
  createdAt: string;
};

export type PurchaseAttempt = {
  id: string;
  sessionId: string;
  itemId: string;
  quotedPriceUsdc: number;
  decision: "challenged" | "paid" | "skipped";
  reason: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  sessionId: string;
  itemId: string;
  kind: "read" | "citation";
  amountUsdc: number;
  paymentSignature: string;
  settlementStatus: "verified" | "batched" | "settled";
  gatewayTransferId: string;
  explorerUrl: string;
  createdAt: string;
  payer?: string;
  liveGatewayTx?: string;
};

export type PayoutSplit = {
  id: string;
  paymentId: string;
  creatorId: string;
  amountUsdc: number;
  splitBps: number;
  txHash: string;
  explorerUrl: string;
};

export type CitationReceipt = {
  id: string;
  sessionId: string;
  itemId: string;
  answerHash: string;
  supportSpan: string;
  readPaymentId: string;
  citationPaymentId: string;
  paymentId: string;
  citationHash: string;
  receiptHash: string;
  claim: string;
  confidence: number;
  impactScore: number;
  citationTollUsdc: number;
  amountUsdc: number;
  settlementStatus: Payment["settlementStatus"];
  createdAt: string;
};

export type AnswerSettlement = {
  id: string;
  sessionId: string;
  answer: string;
  answerHash: string;
  readTollUsdc: number;
  citationTollUsdc: number;
  citedItemIds: string[];
  skippedPurchasedItemIds: string[];
  remainingBudgetUsdc: number;
  brokerBondUsdc: number;
  bondStatus: "posted" | "at_risk" | "released";
  receiptHash: string;
  createdAt: string;
};

export type AgentTrustEvent = {
  id: string;
  title: string;
  network: "Arc Testnet";
  status: "signed_bound" | "settled" | "ready";
  amountUsdc: number;
  agent: string;
  counterparty: string;
  contractAddress: string;
  digest: string;
  txHash?: string;
  note: string;
  createdAt: string;
};

export type ImpactGrant = {
  id: string;
  settlementId: string;
  receiptId: string;
  itemId: string;
  creatorId: string;
  sourceTitle: string;
  amountUsdc: number;
  impactScore: number;
  reason: string;
  txHash: string;
  explorerUrl: string;
  createdAt: string;
};

export type CreatorWebhook = {
  id: string;
  creatorId: string;
  url: string;
  secretHash: string;
  eventTypes: Array<"citation.settled" | "impact.settled" | "cashout.created">;
  status: "active" | "paused";
  createdAt: string;
};

export type WebhookDelivery = {
  id: string;
  webhookId: string;
  creatorId: string;
  eventType: CreatorWebhook["eventTypes"][number];
  targetUrl: string;
  payloadDigest: string;
  signature: string;
  status: "signed_queued" | "delivered" | "failed";
  attempts: number;
  createdAt: string;
};

export type CreatorCashout = {
  id: string;
  creatorId: string;
  amountUsdc: number;
  sourceCount: number;
  status: "queued_arc_settlement" | "settled";
  txHash: string;
  explorerUrl: string;
  createdAt: string;
};

export type PublisherVerification = {
  id: string;
  creatorId: string;
  creatorName: string;
  wallet: string;
  publisherUrl: string;
  feedUrl?: string;
  method: "well-known" | "feed-proof" | "manual-proof";
  challenge: string;
  proofUrl: string;
  proofDigest: string;
  status: "challenge_issued" | "verified" | "failed";
  checkedAt?: string;
  createdAt: string;
};

export type ClaimTrace = {
  id: string;
  sessionId: string;
  claim: string;
  coveragePct: number;
  status: "covered" | "partial" | "unsupported";
  supportingItemIds: string[];
  paidReadIds: string[];
  citationReceiptIds: string[];
  rationale: string;
};

export type TesterAttestation = {
  id: string;
  testerName: string;
  testerRole: "judge" | "creator" | "publisher" | "builder" | "agent-operator" | "other";
  scenarioRun: boolean;
  useful: boolean;
  quote: string;
  walletOrContact?: string;
  liveUrl: string;
  proofHash: string;
  githubIssueUrl: string;
  createdAt: string;
};

export type VerificationCheck = {
  label: string;
  status: "pass" | "warn" | "fail";
  details: string;
};

export type ReceiptVerification = {
  id: string;
  targetType: "citation_receipt" | "answer_settlement" | "payment";
  targetId: string;
  status: "valid" | "warning" | "invalid";
  proofHash: string;
  checks: VerificationCheck[];
  createdAt: string;
};

export type CitationChallenge = {
  id: string;
  receiptId: string;
  sessionId: string;
  itemId: string;
  challenger: string;
  challengeReason: string;
  claimedWeakness: "unsupported_claim" | "weak_support_span" | "wrong_source" | "split_mismatch";
  status: "opened" | "accepted" | "rejected";
  bondImpactUsdc: number;
  buyerReputationDelta: number;
  evaluatorRationale: string;
  proofHash: string;
  createdAt: string;
};

export type AgentSpendPermit = {
  id: string;
  agentName: string;
  operatorContact?: string;
  purpose: string;
  budgetUsdc: number;
  maxTollUsdc: number;
  spentUsdc: number;
  remainingUsdc: number;
  allowedTools: string[];
  allowedEndpoints: string[];
  status: "active" | "exhausted" | "expired" | "revoked";
  expiresAt: string;
  issuedAt: string;
  permitHash: string;
  policyDigest: string;
  bearerPreview: string;
};

export type KleosStore = {
  creators: Creator[];
  contentItems: ContentItem[];
  collaborators: Collaborator[];
  agentSessions: AgentSession[];
  pricingEvents: PricingEvent[];
  purchaseAttempts: PurchaseAttempt[];
  payments: Payment[];
  payoutSplits: PayoutSplit[];
  citationReceipts: CitationReceipt[];
  answerSettlements: AnswerSettlement[];
  agentTrustEvents: AgentTrustEvent[];
  impactGrants: ImpactGrant[];
  creatorWebhooks: CreatorWebhook[];
  webhookDeliveries: WebhookDelivery[];
  creatorCashouts: CreatorCashout[];
  publisherVerifications: PublisherVerification[];
  claimTraces: ClaimTrace[];
  testerAttestations: TesterAttestation[];
  receiptVerifications: ReceiptVerification[];
  citationChallenges: CitationChallenge[];
  agentSpendPermits: AgentSpendPermit[];
};

export type CatalogItem = ContentItem & {
  collaborators: Array<Creator & { splitBps: number }>;
};

export type CharonChallenge = {
  x402Version: 2;
  resourceDescriptor: {
    url: string;
    description: string;
    mimeType: "application/json";
  };
  protocol: "x402";
  scheme: "exact";
  network: "eip155:5042002";
  resource: string;
  priceUsdc: number;
  amountAtomicUsdc: string;
  destination: string;
  acceptedSchemes: Array<{
    scheme: "exact";
    network: "eip155:5042002";
    asset: string;
    amount: string;
    maxAmountRequired: string;
    payTo: string;
    maxTimeoutSeconds: number;
    extra: {
      name: "GatewayWalletBatched";
      version: "1";
      verifyingContract: string;
      localDevelopmentFallback: "kleos-payment-proof";
    };
  }>;
  paymentHeader: "PAYMENT-SIGNATURE";
  gateway: "circle-gateway-nanopayments";
  instructions: string;
};

export type BuyerDecision = {
  itemId: string;
  title: string;
  priceUsdc: number;
  relevanceScore: number;
  valueScore: number;
  decision: "paid" | "skipped";
  reason: string;
};
