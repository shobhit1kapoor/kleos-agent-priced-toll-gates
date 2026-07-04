import { dispatchCreatorWebhooks, getCreatorOpsSnapshot } from "@/lib/kleos/creator-ops";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getCreatorOpsSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    settlementId?: string;
    eventType?: "citation.settled" | "impact.settled" | "cashout.created";
  };

  return Response.json(dispatchCreatorWebhooks(body), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
