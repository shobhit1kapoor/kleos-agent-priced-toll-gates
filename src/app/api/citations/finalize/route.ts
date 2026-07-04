import { finalizeAnswerCitations } from "@/lib/kleos/citation-settlement";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: string;
    answer?: string;
    maxCitationSpendUsdc?: number;
  };

  if (!body.sessionId) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }

  try {
    const result = finalizeAnswerCitations({
      sessionId: body.sessionId,
      answer: body.answer,
      maxCitationSpendUsdc:
        body.maxCitationSpendUsdc === undefined ? undefined : Number(body.maxCitationSpendUsdc),
    });

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Citation finalization failed." },
      { status: 400 },
    );
  }
}
