import { publicOriginFromRequest } from "@/lib/kleos/request-origin";
import { runOneClickTesterFlow } from "@/lib/kleos/tester-flow";
import type { TesterAttestation } from "@/lib/kleos/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = publicOriginFromRequest(request);

  return Response.json(
    {
      name: "Kleos one-click tester flow",
      description:
        "POST testerName, testerRole, quote, and optional walletOrContact to run the hosted no-wallet scenario and receive a proof hash plus public GitHub issue URL.",
      endpoint: `${origin}/api/tester/one-click`,
      defaultBody: {
        testerName: "Your name or handle",
        testerRole: "builder",
        quote: "I ran the Kleos settlement flow and could inspect the proof trail.",
      },
      acceptedRoles: ["builder", "creator", "publisher", "agent-operator", "reviewer", "other"],
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
    testerName?: string;
    testerRole?: TesterAttestation["testerRole"];
    quote?: string;
    walletOrContact?: string;
  };

  return Response.json(
    runOneClickTesterFlow({
      ...body,
      liveUrl: publicOriginFromRequest(request),
    }),
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
