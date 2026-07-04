import { releaseVaultKey } from "@/lib/kleos/content-vault";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/vault/[id]/key">) {
  const { id } = await ctx.params;

  try {
    return Response.json(
      releaseVaultKey({
        itemId: id,
        paymentSignature: request.headers.get("PAYMENT-SIGNATURE"),
      }),
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Vault key release failed." },
      { status: 402 },
    );
  }
}
