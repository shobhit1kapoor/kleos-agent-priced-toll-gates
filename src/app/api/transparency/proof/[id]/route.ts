import { buildTransparencyProof } from "@/lib/kleos/transparency-log";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: RouteContext<"/api/transparency/proof/[id]">) {
  const { id } = await ctx.params;
  const proof = buildTransparencyProof(id);

  if (!proof) {
    return Response.json({ error: "Unknown transparency log entry." }, { status: 404 });
  }

  return Response.json(proof, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
