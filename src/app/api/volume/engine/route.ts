import { runAutonomousVolumeEngine, volumeEngineSummary } from "@/lib/kleos/volume-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(volumeEngineSummary(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    targetRuns?: number;
    taskPrefix?: string;
  };

  return Response.json(runAutonomousVolumeEngine(body), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
