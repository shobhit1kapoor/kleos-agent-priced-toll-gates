import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeDollarSign,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  GitPullRequestArrow,
  RadioTower,
  Send,
  TriangleAlert,
  Users,
} from "lucide-react";
import { getGithubTractionSnapshot } from "@/lib/kleos/github-traction";
import { buildTesterInvitePacket } from "@/lib/kleos/traction-invite";

export const dynamic = "force-dynamic";

const APP_URL = "https://kleos-agent-priced-toll-gates.vercel.app";

const roleOrder = ["creator", "builder", "agent-operator", "other"] as const;

function gateTone(passed: boolean) {
  return passed
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

function shortHash(value?: string | null) {
  if (!value) {
    return "pending";
  }

  return value.length > 22 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

function HeaderLink({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  const className = primary
    ? "inline-flex h-11 items-center gap-2 rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white transition hover:bg-[#2f2f2f]"
    : "inline-flex h-11 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-4 text-sm font-semibold text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818]";

  return (
    <a href={href} className={className}>
      {label}
      <ExternalLink size={15} aria-hidden />
    </a>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-[#e6e6e1] bg-[#fbfbf8] p-4">
      <p className="text-xs font-semibold uppercase text-[#6f686a]">{label}</p>
      <p className="mt-2 break-words font-mono text-lg font-semibold text-[#181818]">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-5 text-[#6f686a]">{detail}</p> : null}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#e8e8e3] p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#deded9] bg-[#f7f7f3] text-[#6f686a]">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase text-[#6f686a]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#181818]">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-[#6f686a]">{description}</p> : null}
      </div>
    </div>
  );
}

function GateCard({ label, passed, detail }: { label: string; passed: boolean; detail: string }) {
  const Icon = passed ? CheckCircle2 : TriangleAlert;

  return (
    <div className={`rounded-xl border p-4 ${gateTone(passed)}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <Icon size={18} aria-hidden />
      </div>
      <p className="mt-3 text-sm leading-5 opacity-85">{detail}</p>
    </div>
  );
}

function CopyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e6e6e1] bg-[#fbfbf8] p-4">
      <p className="text-xs font-semibold uppercase text-[#6f686a]">{label}</p>
      <p className="kleos-copy-wrap mt-3 whitespace-pre-wrap font-mono text-sm leading-6 text-[#2f2f2f]">
        {value}
      </p>
    </div>
  );
}

export default async function TractionPage() {
  const [githubTraction, ...invitePackets] = await Promise.all([
    getGithubTractionSnapshot(),
    ...roleOrder.map((role) => buildTesterInvitePacket(APP_URL, { role })),
  ]);

  const gates = [
    {
      label: "5 public tester issues",
      passed: githubTraction.successGates.fivePublicAttestations,
      detail: `${githubTraction.totals.githubIssueAttestations}/5 issues labeled tester-attestation.`,
    },
    {
      label: "3 scenario runs",
      passed: githubTraction.successGates.threeScenarioRuns,
      detail: `${githubTraction.totals.scenarioRunsAttested}/3 issues confirm the tester ran the scenario.`,
    },
    {
      label: "Creator or publisher",
      passed: githubTraction.successGates.creatorOrPublisher,
      detail: `${githubTraction.totals.creatorOrPublisherAttestations}/1 creator-side attestation.`,
    },
    {
      label: "Builder or operator",
      passed: githubTraction.successGates.builderOrOperator,
      detail: `${githubTraction.totals.builderOrOperatorAttestations}/1 builder or agent-operator attestation.`,
    },
    {
      label: "3 proof hashes",
      passed: githubTraction.successGates.uniqueProofHashes,
      detail: `${githubTraction.totals.proofHashes}/3 unique proof hashes in public issues.`,
    },
  ];

  const primaryInvite = invitePackets[0];
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#181818]">
      <header className="border-b border-[#e0e0dc] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-[#19c37d] text-[#181818]">
              <BadgeDollarSign size={22} aria-hidden />
            </span>
            <span>
              <span className="block text-base font-semibold">Kleos</span>
              <span className="block text-sm text-[#6f686a]">Public traction center</span>
            </span>
          </Link>
          <div className="flex flex-wrap gap-2">
            <HeaderLink href="/test" label="Tester page" />
            <HeaderLink href="/api/traction/github" label="Verify issues" />
            <HeaderLink href={githubTraction.issueCreationUrl} label="Open issue" primary />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div>
            <p className="text-sm font-semibold uppercase text-[#6f686a]">External evidence</p>
            <h1 className="mt-2 max-w-4xl text-4xl font-semibold tracking-tight text-[#181818] md:text-5xl">
              Public Traction Command Center
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f686a]">
              Kleos has live payment, proof, creator, and agent surfaces. This page tracks real external testers who
              ran the scenario, minted proof hashes, and published durable GitHub attestations.
            </p>
          </div>

          <div className="rounded-xl border border-[#e0e0dc] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl border border-[#deded9] bg-[#f7f7f3] text-[#6f686a]">
                <RadioTower size={20} aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase text-[#6f686a]">Public validation</p>
                <p className="mt-1 text-2xl font-semibold text-[#181818]">
                  {githubTraction.totals.githubIssueAttestations} tester issues
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#6f686a]">
              Each attestation is a public GitHub issue with role metadata, a scenario-run confirmation, and a proof
              hash generated by the live tester flow.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          <Metric
            label="Public issues"
            value={String(githubTraction.totals.githubIssueAttestations)}
            detail={githubTraction.reachable ? "GitHub verifier reachable" : "GitHub verifier unavailable"}
          />
          <Metric label="Scenario runs" value={String(githubTraction.totals.scenarioRunsAttested)} />
          <Metric label="Creator-side proof" value={String(githubTraction.totals.creatorOrPublisherAttestations)} />
          <Metric label="Unique proof hashes" value={String(githubTraction.totals.proofHashes)} />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
          <section className="rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
            <SectionHeader
              eyebrow="Public validation"
              title="Public traction gates"
              description="These are intentionally external and durable. Local dashboard clicks do not count until the generated GitHub issues are submitted publicly."
              icon={<ClipboardList size={20} aria-hidden />}
            />
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {gates.map((gate) => (
                <GateCard key={gate.label} {...gate} />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
            <SectionHeader
              eyebrow="Fastest next action"
              title="Send role-specific tester links"
              description="Creator, builder, and agent-operator roles show that different audiences can understand the flow."
              icon={<Send size={20} aria-hidden />}
            />
            <div className="grid gap-4 p-5">
              {primaryInvite?.recommendedBatch.length ? (
                primaryInvite.recommendedBatch.map((invite) => (
                  <a
                    key={`${invite.role}-${invite.inviteUrl}`}
                    href={invite.inviteUrl}
                    className="min-w-0 rounded-xl border border-[#e6e6e1] bg-[#fbfbf8] p-4 transition hover:border-[#b8b8b1] hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 font-semibold text-[#181818]">{invite.label}</p>
                      <ExternalLink size={15} className="text-[#6f686a]" aria-hidden />
                    </div>
                    <p className="kleos-copy-wrap mt-2 text-sm leading-5 text-[#6f686a]">{invite.shortDm}</p>
                  </a>
                ))
              ) : (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                  All public traction roles are currently passing.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.8fr)]">
          <section className="rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
            <SectionHeader
              eyebrow="Invite packets"
              title="Tester roles"
              description="Each packet opens a prefilled tester page that runs the no-wallet scenario and generates a GitHub issue URL."
              icon={<Users size={20} aria-hidden />}
            />
            <div className="grid min-w-0 gap-4 p-5 lg:grid-cols-2">
              {invitePackets.map((packet) => (
                <div
                  key={packet.selectedRole.role}
                  className="min-w-0 rounded-xl border border-[#e6e6e1] bg-[#fbfbf8] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-[#6f686a]">{packet.selectedRole.role}</p>
                      <h3 className="mt-1 text-lg font-semibold text-[#181818]">{packet.selectedRole.label}</h3>
                    </div>
                    <a
                      href={packet.inviteUrl}
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-3 text-sm font-semibold text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818]"
                    >
                      Open
                      <ExternalLink size={14} aria-hidden />
                    </a>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#6f686a]">{packet.selectedRole.whyThisMatters}</p>
                  <p className="kleos-copy-wrap mt-4 rounded-lg border border-[#e6e6e1] bg-white p-3 text-sm leading-6 text-[#2f2f2f]">
                    {packet.copyBlocks.shortDm}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
            <SectionHeader
              eyebrow="Proof trail"
              title="Reviewer links"
              description="These pages and endpoints expose the settlement proof trail without a guided demo."
              icon={<GitPullRequestArrow size={20} aria-hidden />}
            />
            <div className="grid gap-3 p-5">
              <HeaderLink href="/proof" label="Proof explorer" />
              <HeaderLink href="/api/proof-pack" label="Proof pack API" />
              <HeaderLink href="/api/submission/certificate" label="Submission certificate" />
              <HeaderLink href="/api/submission/bundle" label="Submission bundle" />
              <HeaderLink href="/api/traction/campaign" label="Traction campaign API" />
              <HeaderLink href={githubTraction.issueCreationUrl} label="GitHub issue template" />
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
          <SectionHeader
            eyebrow="Outreach copy"
            title="Ready-to-send tester asks"
            description="Use these exactly, then ask testers to submit the generated GitHub issue so the verifier can count it."
            icon={<Send size={20} aria-hidden />}
          />
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            <CopyBlock label="Short DM" value={primaryInvite?.copyBlocks.shortDm ?? "No invite available."} />
            <CopyBlock label="Discord" value={primaryInvite?.copyBlocks.discord ?? "No invite available."} />
            <CopyBlock label="API curl" value={primaryInvite?.directApi.curl ?? "No curl available."} />
            <CopyBlock
              label="Current public issue"
              value={
                githubTraction.issues[0]
                  ? `#${githubTraction.issues[0].number} ${githubTraction.issues[0].title} ${shortHash(githubTraction.issues[0].proofHash)}`
                  : "No public tester issue has been verified yet."
              }
            />
          </div>
        </section>
      </section>
    </main>
  );
}
