import { runA2AAsk } from "@/lib/kleos/a2a";
import { publicOriginFromRequest } from "@/lib/kleos/request-origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    question?: string;
    budgetUsdc?: number;
  };
  const result = await runA2AAsk({
    origin: publicOriginFromRequest(request),
    paymentSignature: request.headers.get("PAYMENT-SIGNATURE"),
    question: body.question,
    budgetUsdc: body.budgetUsdc,
  });

  if (!result.ok) {
    return Response.json(result, {
      status: result.status,
      headers: {
        "PAYMENT-REQUIRED": result.encodedChallenge,
        "Cache-Control": "no-store",
      },
    });
  }

  return Response.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
