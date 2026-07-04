import { getEncryptedVaultItem } from "@/lib/kleos/content-vault";
import { publicOriginFromRequest } from "@/lib/kleos/request-origin";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/vault/[id]">) {
  const { id } = await ctx.params;
  const vault = getEncryptedVaultItem(id, publicOriginFromRequest(request));

  if (!vault) {
    return Response.json({ error: "Unknown encrypted vault item." }, { status: 404 });
  }

  return Response.json(vault, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
