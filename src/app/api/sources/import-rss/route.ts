import { importRssFeed } from "@/lib/kleos/rss-import";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    feedUrl?: string;
    priceUsdc?: number;
    creatorName?: string;
    creatorWallet?: string;
    limit?: number;
  };

  if (!body.feedUrl) {
    return Response.json({ error: "feedUrl is required." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(body.feedUrl);
  } catch {
    return Response.json({ error: "feedUrl must be a valid URL." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return Response.json({ error: "feedUrl must use http or https." }, { status: 400 });
  }

  try {
    const result = await importRssFeed({
      feedUrl: parsedUrl.toString(),
      priceUsdc: body.priceUsdc,
      creatorName: body.creatorName,
      creatorWallet: body.creatorWallet,
      limit: body.limit,
    });

    return Response.json(
      {
        ...result,
        message: `${result.imported.length} RSS/Atom source(s) imported into the priced Kleos catalog.`,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "RSS import failed." },
      { status: 422 },
    );
  }
}
