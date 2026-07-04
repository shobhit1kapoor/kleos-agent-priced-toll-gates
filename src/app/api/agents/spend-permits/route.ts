import { issueAgentSpendPermit, listAgentSpendPermits, spendPermitSummary, verifyAgentSpendPermit } from "@/lib/kleos/spend-permits";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const permitId = url.searchParams.get("permitId") ?? undefined;

  return Response.json(
    {
      name: "Kleos agent spend permits",
      description:
        "Bounded, auditable spend policies for external agents that need to inspect sources, finalize citations, and verify receipts without unlimited authority.",
      summary: spendPermitSummary(),
      permits: listAgentSpendPermits(),
      verification: verifyAgentSpendPermit(permitId),
      defaultPostBody: {
        agentName: "External research agent",
        budgetUsdc: 0.025,
        maxTollUsdc: 0.006,
        expiresInMinutes: 45,
        purpose: "Run one grounded-answer settlement flow with read tolls, citation tolls, and receipt verification.",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Parameters<
    typeof issueAgentSpendPermit
  >[0];

  return Response.json(issueAgentSpendPermit(body), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
