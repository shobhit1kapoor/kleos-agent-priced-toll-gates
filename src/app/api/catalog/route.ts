import { getCatalogItems } from "@/lib/kleos/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    name: "Kleos MCP Catalog",
    description: "Agent-readable priced creator content behind Charon x402 toll gates.",
    items: getCatalogItems().map((item) => ({
      id: item.id,
      title: item.title,
      preview: item.preview,
      sourceUrl: item.sourceUrl,
      rssRoute: item.rssRoute,
      currentPriceUsdc: item.currentPriceUsdc,
      readTollUsdc: item.currentPriceUsdc,
      citationTollUsdc: item.citationPriceUsdc ?? Number((item.currentPriceUsdc * 0.35).toFixed(6)),
      priceBounds: {
        min: item.minPriceUsdc,
        max: item.maxPriceUsdc,
      },
      tags: item.tags,
      collaborators: item.collaborators.map((creator) => ({
        displayName: creator.displayName,
        role: creator.role,
        wallet: creator.wallet,
        splitBps: creator.splitBps,
      })),
      contentEndpoint: `/api/content/${item.id}`,
    })),
  });
}
