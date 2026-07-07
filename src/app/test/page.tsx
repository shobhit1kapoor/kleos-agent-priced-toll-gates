import { TesterPage } from "@/components/tester-page";

export const dynamic = "force-dynamic";

type TesterRole = "reviewer" | "creator" | "publisher" | "builder" | "agent-operator" | "other";

const roles = new Set<TesterRole>(["reviewer", "creator", "publisher", "builder", "agent-operator", "other"]);

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function clean(value: string | string[] | undefined, maxLength: number) {
  return first(value)?.trim().slice(0, maxLength) || undefined;
}

export default async function TestPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const role = first(params.role);

  return (
    <TesterPage
      initialInvite={{
        testerName: clean(params.name, 80),
        testerRole: role && roles.has(role as TesterRole) ? (role as TesterRole) : undefined,
        walletOrContact: clean(params.contact, 120),
        quote: clean(params.quote, 240),
      }}
    />
  );
}
