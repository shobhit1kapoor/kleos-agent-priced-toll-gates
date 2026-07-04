import {
  buildReputationPassport,
  createReputationAttestation,
} from "@/lib/kleos/reputation-passport";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildReputationPassport(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    subject?: string;
    counterparty?: string;
    title?: string;
    note?: string;
    amountUsdc?: number;
  };

  if (!body.subject) {
    return Response.json({ error: "subject is required." }, { status: 400 });
  }

  const amountUsdc = Number(body.amountUsdc ?? 0);
  if (!Number.isFinite(amountUsdc) || amountUsdc < 0) {
    return Response.json({ error: "amountUsdc must be a non-negative number." }, { status: 400 });
  }

  return Response.json(
    createReputationAttestation({
      subject: body.subject,
      counterparty: body.counterparty,
      title: body.title,
      note: body.note,
      amountUsdc,
    }),
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
