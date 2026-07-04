import { mcpDiscovery } from "@/lib/kleos/mcp-rpc";
import { publicOriginFromRequest } from "@/lib/kleos/request-origin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json(mcpDiscovery(publicOriginFromRequest(request)), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
