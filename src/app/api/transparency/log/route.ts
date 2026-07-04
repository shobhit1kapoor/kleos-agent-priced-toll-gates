import { buildTransparencyLog } from "@/lib/kleos/transparency-log";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildTransparencyLog(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
