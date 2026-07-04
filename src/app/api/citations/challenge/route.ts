import {
  challengeCitationReceipt,
  getReceiptAuditTrail,
} from "@/lib/kleos/receipt-verifier";
import type { CitationChallenge } from "@/lib/kleos/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getReceiptAuditTrail(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    receiptId?: string;
    challenger?: string;
    challengeReason?: string;
    claimedWeakness?: CitationChallenge["claimedWeakness"];
  };

  return Response.json(challengeCitationReceipt(body), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
