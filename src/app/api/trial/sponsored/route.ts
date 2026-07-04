import { runSponsoredTrial } from "@/lib/kleos/sponsored-trial";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      name: "Kleos sponsored no-wallet trial",
      description:
        "POST this endpoint to run the full inspect, buy, cite, impact, and reprice loop with a bounded sponsor budget.",
      defaultBody: {
        budgetUsdc: 0.018,
        citationBudgetUsdc: 0.006,
        sponsorPoolUsdc: 0.012,
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
  const body = (await request.json().catch(() => ({}))) as {
    task?: string;
    budgetUsdc?: number;
    citationBudgetUsdc?: number;
    sponsorPoolUsdc?: number;
  };

  return Response.json(runSponsoredTrial(body), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
