import { recomputePrices } from "@/lib/kleos/pricing";
import { getCatalogItems } from "@/lib/kleos/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const pricingEvents = recomputePrices();

  return Response.json(
    {
      pricingEvents,
      catalog: getCatalogItems().map((item) => ({
        id: item.id,
        title: item.title,
        currentPriceUsdc: item.currentPriceUsdc,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
