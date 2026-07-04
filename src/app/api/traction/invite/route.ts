import { publicOriginFromRequest } from "@/lib/kleos/request-origin";
import { buildTesterInvitePacket } from "@/lib/kleos/traction-invite";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  return Response.json(
    await buildTesterInvitePacket(publicOriginFromRequest(request), {
      role: url.searchParams.get("role") ?? undefined,
      testerName: url.searchParams.get("name") ?? undefined,
      quote: url.searchParams.get("quote") ?? undefined,
    }),
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
