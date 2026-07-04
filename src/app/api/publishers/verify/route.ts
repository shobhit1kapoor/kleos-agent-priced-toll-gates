import {
  getPublisherVerificationSnapshot,
  verifyPublisherOwnership,
} from "@/lib/kleos/publisher-verification";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getPublisherVerificationSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    creatorName?: string;
    wallet?: string;
    publisherUrl?: string;
    feedUrl?: string;
    proofUrl?: string;
    proofText?: string;
    method?: "well-known" | "feed-proof" | "manual-proof";
  };

  if (!body.creatorName || !body.wallet || !body.publisherUrl) {
    return Response.json(
      { error: "creatorName, wallet, and publisherUrl are required." },
      { status: 400 },
    );
  }

  try {
    const result = await verifyPublisherOwnership({
      creatorName: body.creatorName,
      wallet: body.wallet,
      publisherUrl: body.publisherUrl,
      feedUrl: body.feedUrl,
      proofUrl: body.proofUrl,
      proofText: body.proofText,
      method: body.method,
    });

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Publisher verification failed." },
      { status: 422 },
    );
  }
}
