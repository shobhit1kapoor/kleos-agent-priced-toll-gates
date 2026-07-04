import { publicOriginFromRequest } from "@/lib/kleos/request-origin";
import { buildTractionCampaign } from "@/lib/kleos/traction";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json(buildTractionCampaign(publicOriginFromRequest(request)), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
