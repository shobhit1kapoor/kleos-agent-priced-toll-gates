import { createCreatorCashouts, getCreatorOpsSnapshot } from "@/lib/kleos/creator-ops";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getCreatorOpsSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST() {
  return Response.json(createCreatorCashouts(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
