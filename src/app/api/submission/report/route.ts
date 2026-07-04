import { buildSubmissionReport } from "@/lib/kleos/submission";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildSubmissionReport(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
