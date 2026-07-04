import { getReceiptAuditTrail, verifyCitationReceipt } from "@/lib/kleos/receipt-verifier";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const receiptId = searchParams.get("receiptId") ?? undefined;

  if (receiptId || searchParams.get("latest") === "true") {
    return Response.json(verifyCitationReceipt(receiptId), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  return Response.json(getReceiptAuditTrail(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    receiptId?: string;
  };

  return Response.json(verifyCitationReceipt(body.receiptId), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
