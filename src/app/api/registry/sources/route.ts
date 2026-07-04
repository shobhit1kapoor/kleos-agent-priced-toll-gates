import { buildSourceRegistry } from "@/lib/kleos/source-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildSourceRegistry(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
