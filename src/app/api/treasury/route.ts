import { buildTreasuryProof } from "@/lib/kleos/public-ops";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildTreasuryProof(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
