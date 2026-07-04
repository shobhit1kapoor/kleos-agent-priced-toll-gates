import { buildAnswerProof } from "@/lib/kleos/answer-proof";
import { publicOriginFromRequest } from "@/lib/kleos/request-origin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return Response.json(
    buildAnswerProof(searchParams.get("settlementId") ?? undefined, publicOriginFromRequest(request)),
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
