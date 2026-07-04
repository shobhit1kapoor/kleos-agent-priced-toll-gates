import { createTesterAttestation, getTractionSnapshot } from "@/lib/kleos/traction";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getTractionSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Parameters<
    typeof createTesterAttestation
  >[0];

  return Response.json(createTesterAttestation(body), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
