"use client";

import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type TesterRole = "reviewer" | "creator" | "publisher" | "builder" | "agent-operator" | "other";

type OneClickResult = {
  status: string;
  summary: string;
  trial: {
    mode: string;
    budgetUsdc: number;
    citationBudgetUsdc: number;
    sponsorPoolUsdc: number;
    sessionId: string;
    answerHash: string;
    citationReceipts: Array<{
      id: string;
      itemId: string;
      receiptHash: string;
      citationTollUsdc: number;
      confidence: number;
    }>;
    impactGrants: number;
  };
  verification: {
    status: string;
    proofHash: string;
    warnings: string[];
  };
  attestation: {
    testerName: string;
    testerRole: TesterRole;
    proofHash: string;
    githubIssueUrl: string;
  };
  githubIssueUrl: string;
};

const roles: Array<{ value: TesterRole; label: string }> = [
  { value: "builder", label: "Builder" },
  { value: "creator", label: "Creator" },
  { value: "publisher", label: "Publisher" },
  { value: "agent-operator", label: "Agent operator" },
  { value: "reviewer", label: "Reviewer" },
  { value: "other", label: "Other" },
];

function shortHash(value?: string) {
  if (!value) {
    return "pending";
  }

  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
}

export function TesterPage({
  initialInvite,
}: {
  initialInvite?: {
    testerName?: string;
    testerRole?: TesterRole;
    walletOrContact?: string;
    quote?: string;
  };
}) {
  const [testerName, setTesterName] = useState(initialInvite?.testerName ?? "");
  const [testerRole, setTesterRole] = useState<TesterRole>(initialInvite?.testerRole ?? "builder");
  const [walletOrContact, setWalletOrContact] = useState(initialInvite?.walletOrContact ?? "");
  const [quote, setQuote] = useState(
    initialInvite?.quote ?? "I ran the Kleos settlement flow and could inspect the proof trail.",
  );
  const [result, setResult] = useState<OneClickResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inviteLoaded = Boolean(
    initialInvite?.testerName || initialInvite?.testerRole || initialInvite?.walletOrContact || initialInvite?.quote,
  );

  const issueUrl = result?.githubIssueUrl;
  const totalCitationTolls = useMemo(
    () =>
      Number(
        (result?.trial.citationReceipts ?? []).reduce((sum, receipt) => sum + receipt.citationTollUsdc, 0).toFixed(6),
      ),
    [result],
  );

  async function runFlow() {
    setBusy(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/tester/one-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testerName: testerName || undefined,
          testerRole,
          walletOrContact: walletOrContact || undefined,
          quote,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tester flow failed with ${response.status}.`);
      }

      const payload = (await response.json()) as OneClickResult;
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tester flow failed.");
    } finally {
      setBusy(false);
    }
  }

  async function copyIssueUrl() {
    if (!issueUrl) {
      return;
    }

    await navigator.clipboard.writeText(issueUrl);
    setCopied(true);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#181818]">
      <section className="border-b border-[#e0e0dc] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#19c37d] text-[#181818]">
              <BadgeDollarSign size={21} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">Kleos</span>
              <span className="block text-xs text-[#6f686a]">Public tester proof</span>
            </span>
          </Link>
          <a
            href="/api/traction/github"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-3 text-sm font-medium text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818]"
          >
            Verify traction
            <ExternalLink size={15} aria-hidden />
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
          <div className="flex items-start gap-4 border-b border-[#e8e8e3] p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#e0e0dc] bg-[#f7f7f3] text-[#6f686a]">
              <ShieldCheck size={22} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium uppercase text-[#6f686a]">External tester run</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#181818] md:text-3xl">
                Create a public Kleos proof hash
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f686a]">
                The page runs the no-wallet settlement scenario, verifies a receipt, mints a tester proof hash, and
                prepares a public GitHub attestation.
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-6">
            {inviteLoaded ? (
              <div className="rounded-lg border border-[#cfe4ff] bg-[#f2f8ff] px-4 py-3 text-sm font-medium text-[#21466d]">
                Tester invite loaded. Run the flow, then submit the generated GitHub issue so the public traction gate can count it.
              </div>
            ) : null}

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase text-[#6f686a]">Name or handle</span>
              <input
                value={testerName}
                onChange={(event) => setTesterName(event.target.value)}
                placeholder="Your name"
                className="h-12 rounded-lg border border-[#deded9] bg-white px-4 text-base outline-none transition placeholder:text-[#8e8a85] focus:border-[#181818]"
              />
            </label>

            <div className="grid gap-2">
              <span className="text-xs font-semibold uppercase text-[#6f686a]">Role</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setTesterRole(role.value)}
                    className={`h-11 rounded-lg border px-3 text-sm font-medium transition ${
                      testerRole === role.value
                        ? "border-[#181818] bg-[#181818] text-white"
                        : "border-[#deded9] bg-white text-[#6f686a] hover:border-[#b8b8b1]"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase text-[#6f686a]">Contact or wallet</span>
              <input
                value={walletOrContact}
                onChange={(event) => setWalletOrContact(event.target.value)}
                placeholder="Optional"
                className="h-12 rounded-lg border border-[#deded9] bg-white px-4 text-base outline-none transition placeholder:text-[#8e8a85] focus:border-[#181818]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase text-[#6f686a]">Feedback quote</span>
              <textarea
                value={quote}
                onChange={(event) => setQuote(event.target.value)}
                rows={4}
                className="resize-none rounded-lg border border-[#deded9] bg-white px-4 py-3 text-base leading-6 outline-none transition focus:border-[#181818]"
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={runFlow}
              disabled={busy}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#181818] px-5 text-base font-semibold text-white transition hover:bg-[#2f2f2f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <ArrowRight size={18} aria-hidden />}
              Run tester flow
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-[#e0e0dc] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl border border-[#e0e0dc] bg-[#f7f7f3] text-[#6f686a]">
                <FileText size={20} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium uppercase text-[#6f686a]">Result</p>
                <h2 className="text-xl font-semibold text-[#181818]">
                  {result ? "Issue ready" : "Awaiting run"}
                </h2>
              </div>
            </div>

            {result ? (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric label="Proof hash" value={shortHash(result.attestation.proofHash)} />
                  <Metric label="Answer hash" value={shortHash(result.trial.answerHash)} />
                  <Metric label="Citation receipts" value={String(result.trial.citationReceipts.length)} />
                  <Metric label="Citation tolls" value={`$${totalCitationTolls.toFixed(4)}`} />
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  {result.summary}
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={copyIssueUrl}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#deded9] bg-white px-4 text-sm font-semibold text-[#181818] transition hover:border-[#b8b8b1]"
                  >
                    <Clipboard size={16} aria-hidden />
                    {copied ? "Copied issue URL" : "Copy issue URL"}
                  </button>
                  <a
                    href={result.githubIssueUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#19c37d] px-4 text-sm font-semibold text-[#181818] transition hover:bg-[#16a66b]"
                  >
                    Open GitHub issue
                    <ExternalLink size={16} aria-hidden />
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {[
                  "No-wallet sponsored scenario",
                  "Receipt verification",
                  "Public GitHub attestation URL",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-[#e6e6e1] px-4 py-3">
                    <CheckCircle2 size={17} className="text-[#19c37d]" aria-hidden />
                    <span className="text-sm font-medium text-[#6f686a]">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#e0e0dc] bg-[#181818] p-6 text-white shadow-sm">
            <p className="text-sm font-medium uppercase text-white/50">Public validation</p>
            <h2 className="mt-1 text-xl font-semibold">Public traction requirements</h2>
            <div className="mt-5 grid gap-3">
              {[
                "5 public tester-attestation issues",
                "3 scenario runs",
                "1 creator or publisher",
                "1 builder or agent operator",
                "3 unique proof hashes",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/76">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e6e6e1] bg-[#fbfbf8] px-4 py-3">
      <p className="text-xs font-semibold uppercase text-[#6f686a]">{label}</p>
      <p className="mt-1 break-all font-mono text-sm font-semibold text-[#181818]">{value}</p>
    </div>
  );
}
