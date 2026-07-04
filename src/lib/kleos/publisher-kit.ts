import { getCatalogItems } from "./store";

export function buildPublisherKit(origin?: string) {
  const sample = getCatalogItems()[0];
  const baseUrl = origin ?? process.env.KLEOS_PUBLIC_URL ?? "http://localhost:3000";

  return {
    name: "Kleos Publisher Kit",
    version: "0.1.0",
    purpose:
      "A drop-in manifest for publishers who want AI agents to pay read tolls, citation tolls, and collaborator splits through Kleos.",
    installPath: "Add /.well-known/kleos.json to a publisher site or expose the same JSON from an RSS/Ghost integration.",
    wellKnownManifest: {
      protocol: "kleos.publisher.v1",
      publisher: "Example Publisher",
      pricingAgent: `${baseUrl}/api/pricing/recompute`,
      catalog: `${baseUrl}/api/catalog`,
      mcp: `${baseUrl}/api/mcp`,
      contentGateway: `${baseUrl}/api/content/{itemId}`,
      sourceRegistry: `${baseUrl}/api/registry/sources`,
      encryptedVault: `${baseUrl}/api/vault/{itemId}`,
      vaultKeyRelease: `${baseUrl}/api/vault/{itemId}/key`,
      agentToAgentAsk: `${baseUrl}/api/a2a/ask`,
      answerProof: `${baseUrl}/api/answers/proof?settlementId={settlementId}`,
      webhookDispatch: `${baseUrl}/api/webhooks/dispatch`,
      creatorCashout: `${baseUrl}/api/creators/cashout`,
      paymentHeader: "PAYMENT-SIGNATURE",
      acceptedScheme: "GatewayWalletBatched",
      network: "Arc Testnet",
      currency: "USDC",
      tolls: {
        read: sample ? sample.currentPriceUsdc : 0.004,
        citation: sample ? sample.citationPriceUsdc ?? sample.currentPriceUsdc * 0.35 : 0.0014,
      },
      splitPolicy: "Collaborator splits must sum to 10000 basis points.",
      notificationPolicy:
        "Creators can receive signed citation, impact, and cash-out webhook payloads keyed by creator wallet.",
      cashoutPolicy:
        "Read toll, citation toll, and impact-pool balances are aggregated into Arc-ready creator cash-out records.",
      crawlerPolicy:
        "AI agents may quote previews for free; full content requires x402 payment; final answers that cite the source must call /api/citations/finalize.",
      vaultPolicy:
        "Publishers can expose encrypted content CIDs publicly while releasing AES-GCM keys only after x402 settlement.",
    },
    rssGhostMapping: {
      title: "item.title",
      sourceUrl: "item.link",
      preview: "item.description or excerpt",
      collaborators: "dc:creator, author, or site-level payout wallet",
      defaultReadTollUsdc: 0.0039,
      defaultCitationTollRatio: 0.35,
    },
    judgeCurl: [
      `curl ${baseUrl}/api/catalog`,
      `curl -i ${baseUrl}/api/content/${sample?.id ?? "ci_arc_gateway_notes"}`,
      `curl ${baseUrl}/api/registry/sources`,
      `curl ${baseUrl}/api/vault/${sample?.id ?? "ci_arc_gateway_notes"}`,
      `curl -H "PAYMENT-SIGNATURE: kleos-payment-proof:${sample?.id ?? "ci_arc_gateway_notes"}:publisher-kit" ${baseUrl}/api/content/${sample?.id ?? "ci_arc_gateway_notes"}`,
      `curl ${baseUrl}/api/answers/proof`,
      `curl -X POST ${baseUrl}/api/webhooks/dispatch`,
      `curl -X POST ${baseUrl}/api/creators/cashout`,
    ],
  };
}
