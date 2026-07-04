import { runBuyerResearchAgent } from "@/lib/kleos/buyer-agent";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    task?: string;
    budgetUsdc?: number;
    buyerWallet?: string;
    buyerReputation?: number;
  };

  const result = runBuyerResearchAgent({
    task:
      body.task ??
      "Compare the available sources and prepare a concise briefing on Kleos's x402 tolls, creator splits, and buyer-agent budget decisions.",
    budgetUsdc: Number(body.budgetUsdc ?? 0.018),
    buyerWallet: body.buyerWallet,
    buyerReputation: body.buyerReputation,
  });

  return Response.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
