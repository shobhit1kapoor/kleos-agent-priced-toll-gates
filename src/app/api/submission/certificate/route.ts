import { buildSubmissionCertificate } from "@/lib/kleos/provenance";

export async function GET() {
  return Response.json(await buildSubmissionCertificate());
}
