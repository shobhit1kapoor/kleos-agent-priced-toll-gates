import { buildOpenApiDocument } from "@/lib/kleos/public-ops";
import { publicOriginFromRequest } from "@/lib/kleos/request-origin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json(buildOpenApiDocument(publicOriginFromRequest(request)), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
