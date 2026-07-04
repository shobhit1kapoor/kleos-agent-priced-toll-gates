import { buildAgentCard } from "@/lib/kleos/agent-card";
import { publicOriginFromRequest } from "@/lib/kleos/request-origin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json(buildAgentCard(publicOriginFromRequest(request)), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
