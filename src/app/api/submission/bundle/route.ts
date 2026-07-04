import { publicOriginFromRequest } from "@/lib/kleos/request-origin";
import { buildSubmissionBundle } from "@/lib/kleos/submission-bundle";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return Response.json(await buildSubmissionBundle(publicOriginFromRequest(request)), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
