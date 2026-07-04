import {
  ARC_TESTNET_GATEWAY_WALLET,
  ARC_TESTNET_NETWORK,
  ARC_TESTNET_USDC,
  KLEOS_AGENT_WALLET,
} from "./config";
import { getLedgerSnapshot } from "./ledger";
import { mcpTools } from "./mcp-rpc";

export function buildAgentCard(origin: string) {
  const ledger = getLedgerSnapshot();

  return {
    schema: "https://kleos.dev/schemas/agent-card.v1.json",
    name: "Kleos",
    type: "settlement-agent",
    version: "0.4.0",
    description:
      "Kleos settles grounded AI answers: agents pay read tolls to inspect creator sources, pay citation tolls only when sources are used, and split every payment to collaborators.",
    homepage: origin,
    agentWallet: KLEOS_AGENT_WALLET,
    network: {
      name: "Arc Testnet",
      chain: ARC_TESTNET_NETWORK,
      usdc: ARC_TESTNET_USDC,
      gatewayWallet: ARC_TESTNET_GATEWAY_WALLET,
    },
    paymentSchemes: [
      {
        scheme: "GatewayWalletBatched",
        protocol: "x402",
        asset: ARC_TESTNET_USDC,
        liveReceipt: {
          ...ledger.gatewayProof.liveX402Receipt,
          explorerUrl: `https://testnet.arcscan.app/tx/${ledger.gatewayProof.liveX402Receipt.receiptId}`,
        },
      },
      {
        scheme: "kleos-local-proof",
        protocol: "deterministic-judge-walkthrough",
        note: "Local proof mode is only for deterministic review and smoke tests; live x402 proof is exposed separately.",
      },
    ],
    services: {
      mcpDiscovery: `${origin}/.well-known/mcp.json`,
      mcpRpc: `${origin}/api/mcp/rpc`,
      mcpPackage: "packages/kleos-mcp",
      a2aAsk: `${origin}/api/a2a/ask`,
      contentGateway: `${origin}/api/content/{id}`,
      catalog: `${origin}/api/catalog`,
      answerProof: `${origin}/api/answers/proof`,
      receiptVerifier: `${origin}/api/receipts/verify`,
      provenance: `${origin}/api/provenance`,
      tractionVerifier: `${origin}/api/traction/github`,
      oneClickTester: `${origin}/api/tester/one-click`,
    },
    tools: mcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
    policies: {
      spendControl:
        "Buyer-agent runs are capped by per-task budgets; citation finalization cannot spend above remaining budget.",
      creatorSettlement:
        "Every paid read and citation creates collaborator split records; creator cash-outs aggregate existing balances only.",
      scoreHonesty:
        "Public score remains below 100 until durable GitHub tester-attestation gates pass.",
      citationIntegrity:
        "Answer receipts can be independently verified and challenged; weak support can mark the broker bond at risk.",
    },
    erc8004Readiness: {
      status: "adapter-ready",
      note: "Kleos exposes a stable agent card, wallet, services, proof links, and local reputation events so ERC-8004 identity/reputation registration can be attached without changing the product flow.",
      onchainRegistrationClaimed: false,
    },
    publicMetrics: {
      creatorsOnboarded: ledger.metrics.creatorsOnboarded,
      creatorIdsPaid: ledger.metrics.creatorIdsPaid,
      buyerAgentRuns: ledger.metrics.buyerAgentRuns,
      paidAccesses: ledger.metrics.paidAccesses,
      citationReceipts: ledger.metrics.citationReceipts,
      answerSettlements: ledger.metrics.answerSettlements,
      totalUsdcMoved: ledger.metrics.totalUsdcMoved,
    },
    proofLinks: {
      status: `${origin}/api/status`,
      treasury: `${origin}/api/treasury`,
      proofPack: `${origin}/api/proof-pack`,
      submissionCertificate: `${origin}/api/submission/certificate`,
      sourceRegistry: `${origin}/api/registry/sources`,
      liveX402Receipt: `https://testnet.arcscan.app/tx/${ledger.gatewayProof.liveX402Receipt.receiptId}`,
    },
  };
}

export type KleosAgentCard = ReturnType<typeof buildAgentCard>;
