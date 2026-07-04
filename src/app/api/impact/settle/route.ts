import { settleImpactPool } from "@/lib/kleos/impact-pool";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    settlementId?: string;
    sponsorPoolUsdc?: number;
  };

  try {
    const result = settleImpactPool({
      settlementId: body.settlementId,
      sponsorPoolUsdc:
        typeof body.sponsorPoolUsdc === "number" && body.sponsorPoolUsdc > 0
          ? body.sponsorPoolUsdc
          : undefined,
    });

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Impact settlement failed." },
      { status: 400 },
    );
  }
}
