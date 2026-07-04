import { registerContentSource } from "@/lib/kleos/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    sourceUrl?: string;
    preview?: string;
    priceUsdc?: number;
    creatorName?: string;
    creatorWallet?: string;
  };

  if (!body.title || !body.sourceUrl || !body.preview || !body.creatorName) {
    return Response.json(
      {
        error: "title, sourceUrl, preview, and creatorName are required.",
      },
      { status: 400 },
    );
  }

  const priceUsdc = Number(body.priceUsdc ?? 0.0025);
  if (!Number.isFinite(priceUsdc) || priceUsdc <= 0) {
    return Response.json({ error: "priceUsdc must be a positive number." }, { status: 400 });
  }

  const item = registerContentSource({
    title: body.title,
    sourceUrl: body.sourceUrl,
    preview: body.preview,
    priceUsdc,
    creatorName: body.creatorName,
    creatorWallet: body.creatorWallet,
  });

  return Response.json(
    {
      item,
      message: "Source registered and immediately available in the Kleos catalog.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
