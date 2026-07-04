import { buildImpactGraph } from "@/lib/kleos/impact-graph";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildImpactGraph(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
