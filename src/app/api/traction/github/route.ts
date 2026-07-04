import { getGithubTractionSnapshot } from "@/lib/kleos/github-traction";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getGithubTractionSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
