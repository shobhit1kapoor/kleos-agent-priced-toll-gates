import Link from "next/link";
import {
  BadgeDollarSign,
  CheckCircle2,
  ExternalLink,
  FileText,
  GitBranch,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { getGithubTractionSnapshot } from "@/lib/kleos/github-traction";
import { buildImpactGraph } from "@/lib/kleos/impact-graph";
import { getLedgerSnapshot } from "@/lib/kleos/ledger";
import { buildPublicStatus } from "@/lib/kleos/public-ops";
import { buildSubmissionCertificate } from "@/lib/kleos/provenance";
import { buildTransparencyLog } from "@/lib/kleos/transparency-log";

export const dynamic = "force-dynamic";

const proofLinks = [
  { label: "Proof pack", href: "/api/proof-pack" },
  { label: "Submission certificate", href: "/api/submission/certificate" },
  { label: "Answer proof", href: "/api/answers/proof" },
  { label: "Receipt verifier", href: "/api/receipts/verify?latest=true" },
  { label: "Transparency log", href: "/api/transparency/log" },
  { label: "Impact graph", href: "/api/impact/graph" },
  { label: "Public status", href: "/api/status" },
  { label: "Traction center", href: "/traction" },
  { label: "GitHub traction", href: "/api/traction/github" },
];

function shortHash(value?: string | null) {
  if (!value) {
    return "pending";
  }

  return value.length > 22 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

function formatUsdc(value: number) {
  return `$${value.toFixed(value < 0.01 ? 4 : 3)}`;
}

function statusTone(status: string) {
  if (status === "pass" || status === "excellent" || status === "100-ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "fail" || status === "blocked" || status === "degraded") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#e8e8e3] p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#deded9] bg-[#f7f7f3] text-[#6f686a]">
        <ShieldCheck size={20} aria-hidden />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase text-[#6f686a]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#181818]">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-[#6f686a]">{description}</p> : null}
      </div>
    </div>
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

function ProofLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[#e6e6e1] bg-white px-4 py-3 text-sm font-semibold text-[#2f2f2f] transition hover:border-[#b8b8b1] hover:text-[#181818]"
    >
      <span>{label}</span>
      <ExternalLink size={15} aria-hidden />
    </a>
  );
}

export default async function ProofPage() {
  const [publicStatus, certificate, githubTraction] = await Promise.all([
    buildPublicStatus(),
    buildSubmissionCertificate(),
    getGithubTractionSnapshot(),
  ]);
  const ledger = getLedgerSnapshot();
  const transparencyLog = buildTransparencyLog();
  const impactGraph = buildImpactGraph();
  const liveReceipt = ledger.gatewayProof.liveX402Receipt;
  const sampleProof = transparencyLog.sampleProofs[0];
  const score = certificate.rubricScoreEstimate;

  const tractionGates = [
    ["Five public attestations", githubTraction.successGates.fivePublicAttestations],
    ["Three scenario runs", githubTraction.successGates.threeScenarioRuns],
    ["Creator or publisher tester", githubTraction.successGates.creatorOrPublisher],
    ["Builder or operator tester", githubTraction.successGates.builderOrOperator],
    ["Three unique proof hashes", githubTraction.successGates.uniqueProofHashes],
  ] as const;

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
              <span className="block text-sm text-[#6f686a]">Settlement proof explorer</span>
            </span>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/test"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-4 text-sm font-semibold text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818]"
            >
              Tester page
              <ExternalLink size={15} aria-hidden />
            </Link>
            <a
              href="/api/proof-pack"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white transition hover:bg-[#2f2f2f]"
            >
              Open proof pack
              <ExternalLink size={15} aria-hidden />
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <div>
            <p className="text-sm font-semibold uppercase text-[#6f686a]">Audit surface</p>
            <h1 className="mt-2 max-w-4xl text-4xl font-semibold tracking-tight text-[#181818] md:text-5xl">
              Kleos Proof Explorer
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f686a]">
              A reviewer-readable index of the live x402 receipt, answer settlement proof, transparency log,
              source-to-creator impact graph, CI-backed invariants, and the remaining public traction gates.
            </p>
          </div>

          <div className="rounded-xl border border-[#e0e0dc] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[#6f686a]">Readiness certificate</p>
                <p className="mt-1 text-2xl font-semibold text-[#181818]">{score.total}/100</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(certificate.status)}`}>
                {certificate.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#6f686a]">{score.scoringNote}</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              <Metric label="Agency" value={`${score.agenticSophistication}/30`} />
              <Metric label="Traction" value={`${score.traction}/30`} />
              <Metric label="Circle" value={`${score.circleToolUsage}/20`} />
              <Metric label="Innovation" value={`${score.innovation}/20`} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          <Metric
            label="Live x402 receipt"
            value={shortHash(liveReceipt.receiptId)}
            detail={`${formatUsdc(liveReceipt.amountUsdc)} via ${liveReceipt.scheme}`}
          />
          <Metric
            label="Transparency root"
            value={shortHash(transparencyLog.rootHash)}
            detail={`${transparencyLog.entryCount} settlement and audit entries`}
          />
          <Metric
            label="Impact graph"
            value={shortHash(impactGraph.graphHash)}
            detail={`${impactGraph.summary.nodes} nodes, ${impactGraph.summary.edges} value-flow edges`}
          />
          <Metric
            label="Citation receipts"
            value={String(ledger.metrics.citationReceipts)}
            detail={`${ledger.metrics.claimTraces} claim trace(s), ${ledger.metrics.validReceiptVerifications} verification(s)`}
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.62fr)]">
          <section className="rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
            <SectionHeader
              eyebrow="Settlement chain"
              title="Source value flow"
              description="The graph links creator sources to read tolls, citation receipts, claim support, split payouts, impact grants, and Arc-ready cash-outs."
            />
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <Metric label="Sources traced" value={String(impactGraph.summary.sources)} />
              <Metric label="Creators traced" value={String(impactGraph.summary.creators)} />
              <Metric label="Value flow" value={formatUsdc(impactGraph.summary.valueFlowUsdc)} />
            </div>
            <div className="border-t border-[#e8e8e3] p-5">
              <p className="text-xs font-semibold uppercase text-[#6f686a]">Sample edges</p>
              <div className="mt-3 grid gap-2">
                {impactGraph.edges.slice(0, 6).map((edge) => (
                  <div
                    key={edge.id}
                    className="grid gap-2 rounded-xl border border-[#e6e6e1] bg-[#fbfbf8] px-4 py-3 text-sm md:grid-cols-[1fr_auto]"
                  >
                    <span className="break-words text-[#2f2f2f]">
                      <span className="font-semibold">{edge.type}</span> from {edge.from} to {edge.to}
                    </span>
                    <span className="font-mono text-[#6f686a]">{edge.amountUsdc ? formatUsdc(edge.amountUsdc) : "proof"}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
            <SectionHeader
              eyebrow="Merkle-style audit"
              title="Transparency inclusion"
              description="Each entry receives a leaf hash and can be verified against the current root."
            />
            <div className="grid gap-4 p-5">
              <Metric label="Root hash" value={shortHash(transparencyLog.rootHash)} />
              <Metric label="Sample proof" value={sampleProof?.verified ? "Verified" : "Pending"} detail={sampleProof?.entryId} />
              <Metric
                label="Root match"
                value={sampleProof?.recomputedRoot === transparencyLog.rootHash ? "Yes" : "No"}
                detail={shortHash(sampleProof?.recomputedRoot)}
              />
              {sampleProof ? <ProofLink label="Open sample inclusion proof" href={`/api/transparency/proof/${sampleProof.entryId}`} /> : null}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]">
          <section className="rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
            <SectionHeader
              eyebrow="Public traction"
              title="Honest 100-point gate"
              description="Kleos stays below 100 until durable external tester issues exist in GitHub."
            />
            <div className="grid gap-3 p-5">
              {tractionGates.map(([label, passed]) => (
                <div
                  key={label}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                    passed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <span className="text-sm font-semibold text-[#2f2f2f]">{label}</span>
                  {passed ? (
                    <CheckCircle2 size={18} className="text-emerald-700" aria-hidden />
                  ) : (
                    <TriangleAlert size={18} className="text-amber-700" aria-hidden />
                  )}
                </div>
              ))}
              <a
                href={githubTraction.issueCreationUrl}
                className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white transition hover:bg-[#2f2f2f]"
              >
                Open attestation issue
                <ExternalLink size={15} aria-hidden />
              </a>
            </div>
          </section>

          <section className="rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
            <SectionHeader
              eyebrow="Reviewer links"
              title="Proof endpoints"
              description="All links are public and safe for asynchronous review."
            />
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {proofLinks.map((link) => (
                <ProofLink key={link.href} {...link} />
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
          <SectionHeader
            eyebrow="Operational checks"
            title="Current certificate checks"
            description="These are the machine-readable checks exposed by the submission certificate."
          />
          <div className="grid gap-3 p-5 lg:grid-cols-2">
            {certificate.checks.map((check) => (
              <div key={check.id} className="rounded-xl border border-[#e6e6e1] bg-[#fbfbf8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#181818]">{check.label}</p>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(check.status)}`}>
                    {check.status}
                  </span>
                </div>
                <p className="mt-2 break-words text-sm leading-6 text-[#6f686a]">{check.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-[#e0e0dc] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-[#deded9] bg-[#f7f7f3] text-[#6f686a]">
              <GitBranch size={19} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-[#6f686a]">Public operations status</p>
              <p className="mt-1 break-words text-sm text-[#6f686a]">{publicStatus.summary}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Metric label="Status" value={publicStatus.status} />
            <Metric label="App" value="Live URL" detail={publicStatus.app} />
            <Metric label="Generated" value={new Date(publicStatus.generatedAt).toLocaleString("en-US")} />
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-4 text-sm font-semibold text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818]"
          >
            <FileText size={16} aria-hidden />
            Return to dashboard
          </Link>
          <a
            href={certificate.judgeProofLinks.liveX402Receipt}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-4 text-sm font-semibold text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818]"
          >
            Live x402 receipt
            <ExternalLink size={15} aria-hidden />
          </a>
        </div>
      </section>
    </main>
  );
}
