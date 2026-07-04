import { getLedgerSnapshot } from "@/lib/kleos/ledger";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    getLedgerSnapshot(),
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
