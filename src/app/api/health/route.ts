import { buildPublicStatus } from "@/lib/kleos/public-ops";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await buildPublicStatus();
  const healthy = status.status !== "degraded";

  return Response.json(
    {
      ok: healthy,
      status: status.status,
      generatedAt: status.generatedAt,
      failingChecks: status.checks.filter((check) => check.status === "fail"),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
