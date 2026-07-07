"use client";

import {
  Activity,
  BadgeDollarSign,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Command,
  Database,
  ExternalLink,
  FileText,
  FilePlus2,
  Gauge,
  GitBranch,
  Landmark,
  LayoutDashboard,
  Link2,
  Play,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Split,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type CatalogItem = {
  id: string;
  title: string;
  preview: string;
  sourceUrl: string;
  rssRoute: string;
  currentPriceUsdc: number;
  citationPriceUsdc?: number;
  minPriceUsdc: number;
  maxPriceUsdc: number;
  tags: string[];
  collaborators: Array<{
    id: string;
    displayName: string;
    role: string;
    wallet: string;
    reputation: number;
    splitBps: number;
  }>;
};

type Ledger = {
  metrics: {
    creatorsOnboarded: number;
    creatorIdsPaid: number;
    buyerAgentRuns: number;
    paidAccesses: number;
    totalPayments: number;
    totalUsdcMoved: number;
    averageToll: number;
    citationReceipts: number;
    answerSettlements: number;
    readTollUsdc: number;
    citationTollUsdc: number;
    purchasedButNotCited: number;
    citationConversionPct: number;
    registeredSources: number;
    agentTrustProofs: number;
    impactGrants: number;
    impactPoolUsdc: number;
    sourcesWithImpactGrants: number;
    claimTraces: number;
    creatorWebhooks: number;
    webhookDeliveries: number;
    creatorCashouts: number;
    creatorCashoutUsdc: number;
    testerAttestations: number;
    scenarioRunsAttested: number;
    receiptVerifications: number;
    validReceiptVerifications: number;
    citationChallenges: number;
    rejectedCitationChallenges: number;
    bondAtRiskUsdc: number;
  };
  gatewayProof: {
    network: string;
    agentWallet: string;
    fundedBalanceUsdc: number;
    approvalTx: string;
    approvalExplorerUrl: string;
    depositTx: string;
    depositExplorerUrl: string;
    liveX402Receipt: {
      receiptId: string;
      payer: string;
      amountUsdc: number;
      scheme: string;
    };
  };
  catalog: CatalogItem[];
  sessions: Array<{
    id: string;
    task: string;
    budgetUsdc: number;
    spentUsdc: number;
    result: string;
    answerHash?: string;
    citationFinalizedAt?: string;
    brokerBondUsdc?: number;
    bondStatus?: "not_posted" | "posted" | "at_risk" | "released";
    createdAt: string;
  }>;
  pricingEvents: Array<{
    id: string;
    itemId: string;
    oldPriceUsdc: number;
    newPriceUsdc: number;
    reason: string;
    createdAt: string;
  }>;
  purchaseAttempts: Array<{
    id: string;
    sessionId: string;
    itemId: string;
    quotedPriceUsdc: number;
    decision: "challenged" | "paid" | "skipped";
    reason: string;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    sessionId: string;
    itemId: string;
    kind: "read" | "citation";
    amountUsdc: number;
    settlementStatus: string;
    gatewayTransferId: string;
    explorerUrl: string;
    createdAt: string;
  }>;
  payoutSplits: Array<{
    id: string;
    paymentId: string;
    creatorId: string;
    amountUsdc: number;
    splitBps: number;
    explorerUrl: string;
  }>;
  citationReceipts: Array<{
    id: string;
    sessionId: string;
    itemId: string;
    answerHash: string;
    supportSpan: string;
    readPaymentId: string;
    citationPaymentId: string;
    paymentId: string;
    citationHash: string;
    receiptHash: string;
    claim: string;
    confidence: number;
    impactScore: number;
    citationTollUsdc: number;
    amountUsdc: number;
    settlementStatus: string;
    createdAt: string;
  }>;
  answerSettlements: Array<{
    id: string;
    sessionId: string;
    answer: string;
    answerHash: string;
    readTollUsdc: number;
    citationTollUsdc: number;
    citedItemIds: string[];
    skippedPurchasedItemIds: string[];
    remainingBudgetUsdc: number;
    brokerBondUsdc: number;
    bondStatus: "posted" | "at_risk" | "released";
    receiptHash: string;
    createdAt: string;
  }>;
  agentTrustEvents: Array<{
    id: string;
    title: string;
    network: string;
    status: "signed_bound" | "settled" | "ready";
    amountUsdc: number;
    agent: string;
    counterparty: string;
    contractAddress: string;
    digest: string;
    txHash?: string;
    note: string;
    createdAt: string;
  }>;
  impactGrants: Array<{
    id: string;
    settlementId: string;
    receiptId: string;
    itemId: string;
    creatorId: string;
    sourceTitle: string;
    amountUsdc: number;
    impactScore: number;
    reason: string;
    txHash: string;
    explorerUrl: string;
    createdAt: string;
  }>;
  testerAttestations: Array<{
    id: string;
    testerName: string;
    testerRole: string;
    scenarioRun: boolean;
    useful: boolean;
    quote: string;
    liveUrl: string;
    proofHash: string;
    githubIssueUrl: string;
    createdAt: string;
  }>;
  rubric: {
    readiness: {
      totalPct: number;
      verdict: string;
    };
    scorecard: Array<{
      id: string;
      criterion: string;
      weightPct: number;
      coverage: "Strong" | "Needs proof" | "Needs live rail";
      evidence: string;
      fullMarksMove: string;
    }>;
  };
};

type AgentRun = {
  session: Ledger["sessions"][number];
  decisions: Array<{
    itemId: string;
    title: string;
    priceUsdc: number;
    relevanceScore: number;
    valueScore: number;
    decision: "paid" | "skipped";
    reason: string;
  }>;
  pricingEvents: Ledger["pricingEvents"];
};

type CitationSettlementResult = {
  settlement: Ledger["answerSettlements"][number];
  citationReceipts: Ledger["citationReceipts"];
  citationPayments: Ledger["payments"];
  payoutSplits: Ledger["payoutSplits"];
  pricingEvents: Ledger["pricingEvents"];
};

type ImpactSettlementResult = {
  settlement: Ledger["answerSettlements"][number];
  impactGrants: Ledger["impactGrants"];
  sponsorPoolUsdc: number;
  reused: boolean;
};

type TesterAttestationResult = {
  attestation: Ledger["testerAttestations"][number];
  totals: {
    testerAttestations: number;
    scenarioRunsAttested: number;
    usefulVotes: number;
    creatorOrBuilderAttestations: number;
  };
};

const defaultTask =
  "Compare the available sources and prepare a concise briefing on Kleos's agent-priced content tolls, x402 payment flow, and collaborator payouts.";

const formatUsdc = (value: number) => `$${value.toFixed(value < 0.01 ? 4 : 3)}`;

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "#overview" },
  { label: "Evidence", icon: Gauge, href: "#evidence" },
  { label: "Proofs", icon: ShieldCheck, href: "#proofs" },
  { label: "Proof explorer", icon: ShieldCheck, href: "/proof" },
  { label: "Creator earnings", icon: CircleDollarSign, href: "/creators" },
  { label: "Settlement", icon: ReceiptText, href: "#settlement" },
  { label: "Sources", icon: BookOpen, href: "#sources" },
  { label: "Agent runs", icon: Bot, href: "#agent" },
  { label: "Payments", icon: ReceiptText, href: "#ledger" },
  { label: "Gateway", icon: Landmark, href: "#gateway" },
  { label: "Tester page", icon: FileText, href: "/test" },
];

function itemTitle(ledger: Ledger | null, itemId: string) {
  return ledger?.catalog.find((item) => item.id === itemId)?.title ?? itemId;
}

function shortHash(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function KleosApp({ initialLedger }: { initialLedger: Ledger }) {
  const [ledger, setLedger] = useState<Ledger | null>(initialLedger);
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);
  const [citationSettlement, setCitationSettlement] = useState<CitationSettlementResult | null>(null);
  const [impactSettlement, setImpactSettlement] = useState<ImpactSettlementResult | null>(null);
  const [testerAttestation, setTesterAttestation] = useState<TesterAttestationResult | null>(null);
  const [task, setTask] = useState(defaultTask);
  const [budget, setBudget] = useState("0.018");
  const [busy, setBusy] = useState<string | null>(null);
  const [lastChallenge, setLastChallenge] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready to run the settlement scenario.");
  const [sourceQuery, setSourceQuery] = useState("");
  const [sourceForm, setSourceForm] = useState({
    title: "Independent climate desk: local flood-risk explainer",
    sourceUrl: "https://example.com/local-flood-risk-explainer",
    preview:
      "A creator-owned explainer with two reporters and a graphics editor; ideal for testing source-level tolls and split payouts.",
    priceUsdc: "0.0045",
    creatorName: "Independent Climate Desk",
    feedUrl: "https://www.circle.com/blog/rss.xml",
  });

  async function refreshLedger() {
    const response = await fetch("/api/dashboard/ledger", { cache: "no-store" });
    const data = (await response.json()) as Ledger;
    setLedger(data);
  }

  async function runAgent() {
    setBusy("agent");
    setStatusMessage("Running buyer agent...");
    try {
      const response = await fetch("/api/agent/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, budgetUsdc: Number(budget) }),
      });
      if (!response.ok) {
        throw new Error(`Buyer agent failed with ${response.status}.`);
      }
      const data = (await response.json()) as AgentRun;
      setAgentRun(data);
      await refreshLedger();
      setStatusMessage(
        `Buyer agent completed: spent ${formatUsdc(data.session.spentUsdc)} of ${formatUsdc(
          data.session.budgetUsdc,
        )}. Finalize citations next.`,
      );
      setLastChallenge(`Buyer agent bought ${data.decisions.filter((decision) => decision.decision === "paid").length} source(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Buyer agent run failed.";
      setStatusMessage(message);
      setLastChallenge(message);
    } finally {
      setBusy(null);
    }
  }

  async function finalizeCitations(sessionId?: string) {
    const activeSessionId = sessionId ?? agentRun?.session.id ?? ledger?.sessions[0]?.id;
    if (!activeSessionId) {
      return;
    }

    setBusy("citations");
    setStatusMessage("Finalizing answer citations...");
    try {
      const response = await fetch("/api/citations/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId,
          answer:
            "Kleos is the settlement layer for grounded AI answers: buyer agents pay to inspect creator sources, pay again only when they cite them, and Arc settles each citation-linked payout to collaborators.",
          maxCitationSpendUsdc: 0.006,
        }),
      });
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorBody.error ?? `Citation finalization failed with ${response.status}.`);
      }
      const data = (await response.json()) as CitationSettlementResult;
      setCitationSettlement(data);
      await refreshLedger();
      setStatusMessage(
        `Citation settlement complete: ${data.citationReceipts.length} receipt(s), ${formatUsdc(
          data.settlement.citationTollUsdc,
        )} citation tolls.`,
      );
      setLastChallenge(`Answer settled with ${data.citationReceipts.length} citation receipt(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Citation finalization failed.";
      setStatusMessage(message);
      setLastChallenge(message);
    } finally {
      setBusy(null);
    }
  }

  async function triggerChallenge() {
    if (!ledger?.catalog[0]) {
      return;
    }

    setBusy("challenge");
    setStatusMessage("Requesting unpaid content to trigger 402...");
    try {
      const response = await fetch(`/api/content/${ledger.catalog[0].id}`, {
        cache: "no-store",
      });
      const data = await response.json();
      setLastChallenge(
        `${response.status} ${data.challenge?.protocol ?? "x402"} toll: ${ledger.catalog[0].title}`,
      );
      setStatusMessage(`402 challenge confirmed for ${ledger.catalog[0].title}.`);
      await refreshLedger();
    } catch (error) {
      const message = error instanceof Error ? error.message : "402 challenge failed.";
      setStatusMessage(message);
      setLastChallenge(message);
    } finally {
      setBusy(null);
    }
  }

  async function reprice() {
    setBusy("pricing");
    setStatusMessage("Recomputing citation-aware prices...");
    try {
      const response = await fetch("/api/pricing/recompute", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Pricing recompute failed with ${response.status}.`);
      }
      const data = (await response.json()) as { pricingEvents?: unknown[]; events?: unknown[] };
      await refreshLedger();
      const count = (data.pricingEvents ?? data.events ?? []).length;
      setStatusMessage(`Seller pricing recomputed: ${count} price event(s).`);
      setLastChallenge(`Seller pricing recomputed: ${count} event(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pricing recompute failed.";
      setStatusMessage(message);
      setLastChallenge(message);
    } finally {
      setBusy(null);
    }
  }

  async function settleImpact(settlementId?: string) {
    const activeSettlementId = settlementId ?? citationSettlement?.settlement.id ?? ledger?.answerSettlements[0]?.id;
    if (!activeSettlementId) {
      return;
    }

    setBusy("impact");
    setStatusMessage("Allocating retroactive impact pool...");
    try {
      const response = await fetch("/api/impact/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementId: activeSettlementId,
          sponsorPoolUsdc: 0.012,
        }),
      });
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorBody.error ?? `Impact settlement failed with ${response.status}.`);
      }
      const data = (await response.json()) as ImpactSettlementResult;
      setImpactSettlement(data);
      await refreshLedger();
      setStatusMessage(
        `Impact pool allocated: ${formatUsdc(data.sponsorPoolUsdc)} across ${data.impactGrants.length} collaborator grant(s).`,
      );
      setLastChallenge(`Impact pool allocated: ${data.impactGrants.length} grant(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impact settlement failed.";
      setStatusMessage(message);
      setLastChallenge(message);
    } finally {
      setBusy(null);
    }
  }

  async function registerSource() {
    setBusy("source");
    setStatusMessage("Registering creator source...");
    try {
      const response = await fetch("/api/sources/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sourceForm,
          priceUsdc: Number(sourceForm.priceUsdc),
        }),
      });
      if (!response.ok) {
        throw new Error(`Source registration failed with ${response.status}.`);
      }
      await refreshLedger();
      setStatusMessage("Creator source registered and added to the priced catalog.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Source registration failed.";
      setStatusMessage(message);
    } finally {
      setBusy(null);
    }
  }

  async function importFeed() {
    setBusy("feed");
    setStatusMessage("Importing live RSS/Atom feed...");
    try {
      const response = await fetch("/api/sources/import-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedUrl: sourceForm.feedUrl,
          priceUsdc: Number(sourceForm.priceUsdc),
          creatorName: sourceForm.creatorName,
          limit: 2,
        }),
      });
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorBody.error ?? `Feed import failed with ${response.status}.`);
      }
      const data = (await response.json()) as { imported?: unknown[]; feed?: { mode?: string } };
      await refreshLedger();
      setStatusMessage(
        `RSS/Atom import complete: ${data.imported?.length ?? 0} source(s) added in ${data.feed?.mode ?? "live"} mode.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Feed import failed.";
      setStatusMessage(message);
    } finally {
      setBusy(null);
    }
  }

  async function runJudgeScenario() {
    setBusy("scenario");
    setStatusMessage("Running full settlement scenario: research, citation settlement, and repricing...");
    try {
      const researchResponse = await fetch("/api/agent/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: defaultTask,
          budgetUsdc: 0.018,
        }),
      });
      if (!researchResponse.ok) {
        throw new Error(`Settlement scenario research failed with ${researchResponse.status}.`);
      }
      const research = (await researchResponse.json()) as AgentRun;
      setAgentRun(research);

      const citationResponse = await fetch("/api/citations/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: research.session.id,
          answer:
            "Kleos turns paid source access into answer settlement: agents inspect creator work, cite only the sources that support the final answer, and settle read plus citation tolls to collaborators.",
          maxCitationSpendUsdc: 0.006,
        }),
      });
      if (!citationResponse.ok) {
        const errorBody = (await citationResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorBody.error ?? `Settlement scenario citation settlement failed with ${citationResponse.status}.`);
      }
      const settlement = (await citationResponse.json()) as CitationSettlementResult;
      setCitationSettlement(settlement);
      const impactResponse = await fetch("/api/impact/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementId: settlement.settlement.id,
          sponsorPoolUsdc: 0.012,
        }),
      });
      if (!impactResponse.ok) {
        throw new Error(`Settlement scenario impact pool failed with ${impactResponse.status}.`);
      }
      const impact = (await impactResponse.json()) as ImpactSettlementResult;
      setImpactSettlement(impact);
      const pricingResponse = await fetch("/api/pricing/recompute", { method: "POST" });
      if (!pricingResponse.ok) {
        throw new Error(`Settlement scenario pricing failed with ${pricingResponse.status}.`);
      }
      await refreshLedger();
      setStatusMessage(
        `Scenario complete: ${research.decisions.filter((decision) => decision.decision === "paid").length} reads, ${
          settlement.citationReceipts.length
        } citation receipt(s), ${formatUsdc(settlement.settlement.citationTollUsdc)} citation tolls, ${formatUsdc(
          impact.sponsorPoolUsdc,
        )} impact pool.`,
      );
      setLastChallenge(`Scenario complete: ${settlement.citationReceipts.length} citation receipt(s).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Settlement scenario failed.";
      setStatusMessage(message);
      setLastChallenge(message);
    } finally {
      setBusy(null);
    }
  }

  async function attestScenario() {
    setBusy("attest");
    setStatusMessage("Minting tester attestation...");
    try {
      const response = await fetch("/api/traction/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testerName: "Live dashboard tester",
          testerRole: "builder",
          scenarioRun: true,
          useful: true,
          quote:
            "I ran the Kleos scenario and could inspect read tolls, citation receipts, claim proof, creator payouts, and live x402 proof.",
          liveUrl: window.location.origin,
        }),
      });
      if (!response.ok) {
        throw new Error(`Tester attestation failed with ${response.status}.`);
      }
      const data = (await response.json()) as TesterAttestationResult;
      setTesterAttestation(data);
      await refreshLedger();
      setStatusMessage(`Tester attestation minted: ${shortHash(data.attestation.proofHash)}.`);
      setLastChallenge(`Tester attestation ready: ${shortHash(data.attestation.proofHash)}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tester attestation failed.";
      setStatusMessage(message);
      setLastChallenge(message);
    } finally {
      setBusy(null);
    }
  }

  const latestSession = ledger?.sessions[0];
  const latestSettlement = citationSettlement?.settlement ?? ledger?.answerSettlements[0];
  const latestImpactGrants =
    impactSettlement?.impactGrants ??
    (latestSettlement
      ? ledger?.impactGrants.filter((grant) => grant.settlementId === latestSettlement.id) ?? []
      : ledger?.impactGrants.slice(0, 6) ?? []);
  const metrics = ledger?.metrics;
  const paidDecisions = agentRun?.decisions.filter((decision) => decision.decision === "paid") ?? [];
  const allDecisions = agentRun?.decisions ?? [];

  const catalog = useMemo(() => {
    const items = [...(ledger?.catalog ?? [])].sort((a, b) => b.currentPriceUsdc - a.currentPriceUsdc);
    if (!sourceQuery.trim()) {
      return items;
    }

    const query = sourceQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }, [ledger, sourceQuery]);

  const sourcePrices = ledger?.catalog.map((item) => item.currentPriceUsdc) ?? [];
  const maxPrice = Math.max(...sourcePrices, 0.001);
  const paidShare =
    allDecisions.length > 0 ? Math.round((paidDecisions.length / allDecisions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#181818]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-72 overflow-hidden border-r border-[#e0e0dc] bg-[#181818] text-white xl:flex xl:flex-col">
        <div className="flex h-24 shrink-0 items-start gap-3 border-b border-white/10 px-5 pt-7">
          <div className="grid size-9 place-items-center rounded-lg bg-[#19c37d] text-[#181818]">
            <BadgeDollarSign size={19} aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold">Kleos</p>
            <p className="text-xs text-white/55">Settlement operations</p>
          </div>
        </div>

        <nav className="kleos-sidebar-scroll min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-5 pr-2">
          <div>
            <p className="px-3 text-xs font-medium uppercase text-white/38">Workspace</p>
            <div className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-white/72 transition hover:bg-white/8 hover:text-white"
                  >
                    <Icon size={16} aria-hidden />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-3 text-xs font-medium uppercase text-white/38">Interfaces</p>
            <div className="mt-2 space-y-1">
              {[
                "GET /api/catalog",
                "GET /api/content/:id",
                "POST /api/agent/research",
                "POST /api/citations/finalize",
                "GET /api/answers/proof",
                "POST /api/receipts/verify",
                "POST /api/citations/challenge",
                "POST /api/traction/attest",
                "GET /api/traction/campaign",
                "GET /api/traction/github",
                "GET /test",
                "GET /proof",
                "GET /creators",
                "POST /api/impact/settle",
                "GET /api/mcp",
              ].map((endpoint) => (
                  <code
                    key={endpoint}
                    className="block rounded-lg px-3 py-2 font-mono text-[11px] text-white/54"
                  >
                    {endpoint}
                  </code>
                ))}
              <code className="block rounded-lg px-3 py-2 font-mono text-[11px] text-white/54">
                GET /api/proof-pack
              </code>
              <code className="block rounded-lg px-3 py-2 font-mono text-[11px] text-white/54">
                GET /api/submission/report
              </code>
            </div>
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck size={15} className="text-[#19c37d]" aria-hidden />
              Arc Testnet funded
            </div>
            <p className="mt-2 font-mono text-xs text-white/60">
              {ledger?.gatewayProof.agentWallet ? shortHash(ledger.gatewayProof.agentWallet) : "Not configured"}
            </p>
          </div>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-[#e0e0dc] bg-white/88 px-3 py-3 backdrop-blur sm:px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#181818] text-[#19c37d] xl:hidden">
              <BadgeDollarSign size={18} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-2 text-xs text-[#6f686a] sm:flex">
                <span>Dashboard</span>
                <ChevronRight size={13} aria-hidden />
                <span className="text-[#181818]">Overview</span>
              </div>
              <h1 className="truncate text-base font-semibold leading-6 sm:text-lg md:text-xl">
                Settlement layer for grounded AI answers
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={triggerChallenge}
              disabled={busy !== null}
              title="Trigger a 402 challenge"
              aria-label="Trigger a 402 challenge"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-3 text-sm font-medium text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818] disabled:opacity-50"
            >
              <ShieldCheck size={16} aria-hidden />
              <span className="hidden md:inline">Test 402</span>
            </button>
            <button
              type="button"
              onClick={reprice}
              disabled={busy !== null}
              title="Recompute prices"
              aria-label="Recompute prices"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-3 text-sm font-medium text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818] disabled:opacity-50"
            >
              <RefreshCw size={16} aria-hidden />
              <span className="hidden md:inline">Reprice sources</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6" id="overview">
          <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#6f686a]">Citation settlement operations</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#181818] md:text-3xl">
                Kleos Answer Settlement Network
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#e0e0dc] bg-white px-3 py-2 text-sm text-[#6f686a] shadow-sm">
              <Activity size={15} className="text-[#19c37d]" aria-hidden />
              {lastChallenge ?? "Gateway online"}
            </div>
          </section>

          <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <Card>
              <CardHeader
                icon={<Command size={18} aria-hidden />}
                label="Settlement workflow"
                title="Run settlement scenario"
                action={
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={attestScenario}
                      disabled={busy !== null}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-3 text-sm font-medium text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818] disabled:opacity-50"
                    >
                      <ShieldCheck size={15} aria-hidden />
                      {busy === "attest" ? "Minting" : "Attest"}
                    </button>
                    <button
                      type="button"
                      onClick={runJudgeScenario}
                      disabled={busy !== null}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#181818] px-3 text-sm font-medium text-white transition hover:bg-[#2f2f2f] disabled:opacity-50"
                    >
                      <Play size={15} aria-hidden />
                      {busy === "scenario" ? "Running" : "Run scenario"}
                    </button>
                  </div>
                }
              />
              <div className="border-t border-[#e9e9e4] px-4 pt-4">
                <div className="flex items-start gap-2 rounded-lg border border-[#e0e0dc] bg-[#fbfbf8] px-3 py-2 text-sm text-[#6f686a]">
                  <Activity size={15} className="mt-0.5 shrink-0 text-[#19c37d]" aria-hidden />
                  <span>{statusMessage}</span>
                </div>
                {testerAttestation ? (
                  <div className="mt-3 grid gap-2 rounded-lg border border-[#e0e0dc] bg-white p-3 text-xs text-[#6f686a] md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="font-medium uppercase text-[#6f686a]">Tester attestation</p>
                      <p className="mt-1 font-mono text-[#181818]">
                        {shortHash(testerAttestation.attestation.proofHash)}
                      </p>
                    </div>
                    <a
                      href={testerAttestation.attestation.githubIssueUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-[#deded9] px-3 font-medium text-[#181818] transition hover:border-[#b8b8b1]"
                    >
                      <ExternalLink size={14} aria-hidden />
                      Open proof issue
                    </a>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-5">
                <ReviewStep
                  step="01"
                  title="Inspect"
                  detail="Buyer agent ranks paid sources by relevance, trust, toll, reputation, and budget fit."
                />
                <ReviewStep
                  step="02"
                  title="Buy"
                  detail="Read tolls unlock full content and create x402-style settlement plus split payouts."
                />
                <ReviewStep
                  step="03"
                  title="Cite"
                  detail="Only cited sources get second-stage citation tolls and answer-linked receipts."
                />
                <ReviewStep
                  step="04"
                  title="Reprice"
                  detail="Seller agent reprices from citation rate, confidence, paid reads, and skipped demand."
                />
                <ReviewStep
                  step="05"
                  title="Reward"
                  detail="Sponsor pool pays extra only to cited sources that proved impact in the final answer."
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<ShieldCheck size={18} aria-hidden />}
                label="Live proof"
                title="Gateway status"
              />
              <div className="grid gap-3 border-t border-[#e9e9e4] p-4 sm:grid-cols-2 2xl:grid-cols-1">
                <MiniMetric
                  label="Gateway balance"
                  value={`${ledger?.gatewayProof.fundedBalanceUsdc ?? 0} testnet USDC`}
                />
                <MiniMetric
                  label="Live x402 receipt"
                  value={ledger?.gatewayProof.liveX402Receipt.receiptId ?? "Pending"}
                />
                <CopyBox label="Agent wallet" value={ledger?.gatewayProof.agentWallet ?? "Not configured"} />
              </div>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-6">
            <StatCard
              label="Testnet USDC moved"
              value={formatUsdc(metrics?.totalUsdcMoved ?? 0)}
              detail={`${formatUsdc(metrics?.citationTollUsdc ?? 0)} citation tolls`}
              icon={<CircleDollarSign size={18} aria-hidden />}
              trend="+ funded"
            />
            <StatCard
              label="Answer settlements"
              value={metrics?.answerSettlements ?? 0}
              detail={`${metrics?.citationConversionPct ?? 0}% read-to-citation conversion`}
              icon={<ReceiptText size={18} aria-hidden />}
              trend="answer-linked"
            />
            <StatCard
              label="Paid source reads"
              value={metrics?.paidAccesses ?? 0}
              detail={`${metrics?.purchasedButNotCited ?? 0} bought but not cited`}
              icon={<ReceiptText size={18} aria-hidden />}
              trend={`${paidShare}% paid`}
            />
            <StatCard
              label="Creators onboarded"
              value={metrics?.creatorsOnboarded ?? 0}
              detail={`${metrics?.registeredSources ?? 0} creator-added sources`}
              icon={<Split size={18} aria-hidden />}
              trend="royalty graph"
            />
            <StatCard
              label="Buyer agent runs"
              value={metrics?.buyerAgentRuns ?? 0}
              detail={`${ledger?.catalog.length ?? 0} priced sources indexed`}
              icon={<Bot size={18} aria-hidden />}
              trend="budgeted"
            />
            <StatCard
              label="Impact pool"
              value={formatUsdc(metrics?.impactPoolUsdc ?? 0)}
              detail={`${metrics?.impactGrants ?? 0} retroactive grants`}
              icon={<BadgeDollarSign size={18} aria-hidden />}
              trend="sponsor-backed"
            />
          </section>

          <section className="grid gap-5 2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" id="evidence">
            <Card>
              <CardHeader
                icon={<Gauge size={18} aria-hidden />}
                label="Operational evidence"
                title="System coverage"
              />
              <div className="border-t border-[#e9e9e4] p-4">
                <p className="text-4xl font-semibold tabular-nums text-[#181818]">
                  Live
                </p>
                <p className="mt-3 text-sm leading-6 text-[#6f686a]">
                  {ledger?.rubric.readiness.verdict}
                </p>
                <div className="mt-4 grid gap-3">
                  <MiniMetric label="Primary lane" value="RFB 6 creator monetization" />
                  <MiniMetric label="Supporting lanes" value="RFB 1, RFB 3, RFB 5" />
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<Command size={18} aria-hidden />}
                label="System map"
                title="What Kleos proves"
              />
              <div className="grid gap-3 border-t border-[#e9e9e4] p-4 md:grid-cols-2">
                {ledger?.rubric.scorecard.map((item) => (
                  <RubricCard key={item.id} item={item} />
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-5 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" id="proofs">
            <Card>
              <CardHeader
                icon={<FilePlus2 size={18} aria-hidden />}
                label="Creator intake"
                title="Register paid source"
                action={
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={importFeed}
                      disabled={busy !== null}
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#deded9] bg-white px-3 text-sm font-medium text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818] disabled:opacity-50 sm:w-auto"
                    >
                      <Database size={15} aria-hidden />
                      {busy === "feed" ? "Importing" : "Import RSS"}
                    </button>
                    <button
                      type="button"
                      onClick={registerSource}
                      disabled={busy !== null}
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#181818] px-3 text-sm font-medium text-white transition hover:bg-[#2f2f2f] disabled:opacity-50 sm:w-auto"
                    >
                      <FilePlus2 size={15} aria-hidden />
                      {busy === "source" ? "Registering" : "Register"}
                    </button>
                  </div>
                }
              />
              <div className="grid min-w-0 gap-3 border-t border-[#e9e9e4] p-4 md:grid-cols-2">
                <label className="grid min-w-0 gap-2 text-xs font-medium uppercase text-[#6f686a] md:col-span-2">
                  Source title
                  <input
                    value={sourceForm.title}
                    onChange={(event) =>
                      setSourceForm((current) => ({ ...current, title: event.target.value }))
                    }
                    className="h-10 w-full min-w-0 rounded-lg border border-[#e0e0dc] bg-white px-3 text-sm normal-case text-[#181818] outline-none transition focus:border-[#181818]"
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-xs font-medium uppercase text-[#6f686a]">
                  Creator
                  <input
                    value={sourceForm.creatorName}
                    onChange={(event) =>
                      setSourceForm((current) => ({ ...current, creatorName: event.target.value }))
                    }
                    className="h-10 w-full min-w-0 rounded-lg border border-[#e0e0dc] bg-white px-3 text-sm normal-case text-[#181818] outline-none transition focus:border-[#181818]"
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-xs font-medium uppercase text-[#6f686a] md:col-span-2">
                  Source URL
                  <input
                    value={sourceForm.sourceUrl}
                    onChange={(event) =>
                      setSourceForm((current) => ({ ...current, sourceUrl: event.target.value }))
                    }
                    className="h-10 w-full min-w-0 rounded-lg border border-[#e0e0dc] bg-white px-3 text-sm normal-case text-[#181818] outline-none transition focus:border-[#181818]"
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-xs font-medium uppercase text-[#6f686a] md:col-span-2">
                  RSS / Atom feed URL
                  <input
                    value={sourceForm.feedUrl}
                    onChange={(event) =>
                      setSourceForm((current) => ({ ...current, feedUrl: event.target.value }))
                    }
                    className="h-10 w-full min-w-0 rounded-lg border border-[#e0e0dc] bg-white px-3 text-sm normal-case text-[#181818] outline-none transition focus:border-[#181818]"
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-xs font-medium uppercase text-[#6f686a] md:col-span-2">
                  Preview
                  <textarea
                    value={sourceForm.preview}
                    onChange={(event) =>
                      setSourceForm((current) => ({ ...current, preview: event.target.value }))
                    }
                    className="min-h-20 w-full min-w-0 resize-none rounded-lg border border-[#e0e0dc] bg-white px-3 py-2 text-sm normal-case text-[#181818] outline-none transition focus:border-[#181818]"
                  />
                </label>
                <label className="grid w-full max-w-40 min-w-0 gap-2 text-xs font-medium uppercase text-[#6f686a]">
                  Toll
                  <input
                    value={sourceForm.priceUsdc}
                    onChange={(event) =>
                      setSourceForm((current) => ({ ...current, priceUsdc: event.target.value }))
                    }
                    className="h-10 w-full min-w-0 rounded-lg border border-[#e0e0dc] bg-white px-3 text-sm normal-case text-[#181818] outline-none transition focus:border-[#181818]"
                  />
                </label>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<ShieldCheck size={18} aria-hidden />}
                label="Evidence layer"
                title="Citation and A2A proof"
              />
              <div className="grid gap-4 border-t border-[#e9e9e4] p-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-[#6f686a]">Citation receipts</p>
                  <div className="mt-3 space-y-3">
                    {ledger?.citationReceipts.slice(0, 3).map((receipt) => (
                      <div key={receipt.id} className="rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-1 text-sm font-semibold">
                            {itemTitle(ledger, receipt.itemId)}
                          </p>
                          <span className="font-mono text-xs text-[#6f686a]">
                            {formatUsdc(receipt.citationTollUsdc)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[#6f686a]">{receipt.claim}</p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6f686a]">
                          {receipt.supportSpan}
                        </p>
                        <p className="mt-2 font-mono text-[11px] text-[#8e8a85]">
                          answer {shortHash(receipt.answerHash)} - receipt {shortHash(receipt.receiptHash)}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-[#8e8a85]">
                          read {shortHash(receipt.readPaymentId)} - cite{" "}
                          {shortHash(receipt.citationPaymentId)} - {receipt.confidence}% confidence
                        </p>
                      </div>
                    ))}
                    {ledger?.citationReceipts.length === 0 ? (
                      <p className="rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] p-3 text-sm text-[#6f686a]">
                        Run the buyer agent, then finalize citations to charge only sources used in the answer.
                      </p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-[#6f686a]">Agent-to-agent proof</p>
                  <div className="mt-3 space-y-3">
                    {ledger?.agentTrustEvents.map((event) => (
                      <div key={event.id} className="rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold">{event.title}</p>
                          <StatusPill>{event.status.replace("_", " ")}</StatusPill>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[#6f686a]">{event.note}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <MiniMetric label="Amount" value={formatUsdc(event.amountUsdc)} />
                          <MiniMetric label="Digest" value={shortHash(event.digest)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]" id="agent">
            <Card>
              <CardHeader
                icon={<Bot size={18} aria-hidden />}
                label="Buyer agent"
                title="Research run"
                action={
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={runAgent}
                      disabled={busy !== null}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#deded9] bg-white px-3 text-sm font-medium text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818] disabled:opacity-50"
                    >
                      <Play size={15} aria-hidden />
                      {busy === "agent" ? "Running" : "Run agent"}
                    </button>
                    <button
                      type="button"
                      onClick={() => finalizeCitations()}
                      disabled={busy !== null || !latestSession}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#181818] px-3 text-sm font-medium text-white transition hover:bg-[#2f2f2f] disabled:opacity-50"
                    >
                      <ReceiptText size={15} aria-hidden />
                      {busy === "citations" ? "Finalizing" : "Finalize citations"}
                    </button>
                  </div>
                }
              />
              <div className="grid min-w-0 gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_128px]">
                <textarea
                  value={task}
                  onChange={(event) => setTask(event.target.value)}
                  className="min-h-28 min-w-0 resize-none rounded-lg border border-[#e0e0dc] bg-[#fbfbf8] px-3 py-3 text-sm text-[#181818] outline-none transition focus:border-[#181818]"
                />
                <label className="grid min-w-0 content-start gap-2 text-xs font-medium uppercase text-[#6f686a]">
                  Budget
                  <input
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    className="h-10 w-full min-w-0 rounded-lg border border-[#e0e0dc] bg-white px-3 text-sm font-medium text-[#181818] outline-none transition focus:border-[#181818]"
                  />
                </label>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<FileText size={18} aria-hidden />}
                label="Latest answer"
                title="Agent conclusion"
              />
              <div className="p-4">
                <p className="min-h-24 text-sm leading-6 text-[#2f2f2f]">
                  {latestSession?.result ??
                    "Run the buyer agent to produce an answer grounded in selected paid sources."}
                </p>
                {latestSession ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniMetric label="Budget" value={formatUsdc(latestSession.budgetUsdc)} />
                    <MiniMetric label="Spent" value={formatUsdc(latestSession.spentUsdc)} />
                  </div>
                ) : null}
              </div>
            </Card>
          </section>

          <section className="grid gap-5 2xl:grid-cols-3" id="settlement">
            <Card>
              <CardHeader
                icon={<ReceiptText size={18} aria-hidden />}
                label="Answer settlement"
                title="Read tolls vs citation tolls"
                action={
                  <button
                    type="button"
                    onClick={() => finalizeCitations()}
                    disabled={busy !== null || !latestSession}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#181818] px-3 text-sm font-medium text-white transition hover:bg-[#2f2f2f] disabled:opacity-50"
                  >
                    <ReceiptText size={15} aria-hidden />
                    {busy === "citations" ? "Settling" : "Settle answer"}
                  </button>
                }
              />
              <div className="grid gap-3 border-t border-[#e9e9e4] p-4 sm:grid-cols-2">
                <MiniMetric
                  label="Read tolls paid"
                  value={formatUsdc(latestSettlement?.readTollUsdc ?? metrics?.readTollUsdc ?? 0)}
                />
                <MiniMetric
                  label="Citation tolls paid"
                  value={formatUsdc(latestSettlement?.citationTollUsdc ?? metrics?.citationTollUsdc ?? 0)}
                />
                <MiniMetric
                  label="Cited sources"
                  value={latestSettlement?.citedItemIds.length ?? metrics?.citationReceipts ?? 0}
                />
                <MiniMetric
                  label="Bought not cited"
                  value={latestSettlement?.skippedPurchasedItemIds.length ?? metrics?.purchasedButNotCited ?? 0}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<ShieldCheck size={18} aria-hidden />}
                label="Bonded broker"
                title="Capital-at-risk citation proof"
              />
              <div className="space-y-3 border-t border-[#e9e9e4] p-4">
                <p className="text-sm leading-6 text-[#6f686a]">
                  {latestSettlement
                    ? `Evaluator bond is ${latestSettlement.bondStatus}; answer ${shortHash(
                        latestSettlement.answerHash,
                      )} cited ${latestSettlement.citedItemIds.length} source${
                        latestSettlement.citedItemIds.length === 1 ? "" : "s"
                      } and left ${latestSettlement.skippedPurchasedItemIds.length} purchased source${
                        latestSettlement.skippedPurchasedItemIds.length === 1 ? "" : "s"
                      } uncited.`
                    : "Finalize an answer to post a local ERC-8004-ready citation bond and receipt hash."}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniMetric
                    label="Broker bond"
                    value={formatUsdc(latestSettlement?.brokerBondUsdc ?? latestSession?.brokerBondUsdc ?? 0)}
                  />
                  <MiniMetric
                    label="Receipt hash"
                    value={latestSettlement?.receiptHash ? shortHash(latestSettlement.receiptHash) : "Pending"}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<BadgeDollarSign size={18} aria-hidden />}
                label="Impact pool"
                title="Retroactive source rewards"
                action={
                  <button
                    type="button"
                    onClick={() => settleImpact()}
                    disabled={busy !== null || !latestSettlement}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#181818] px-3 text-sm font-medium text-white transition hover:bg-[#2f2f2f] disabled:opacity-50"
                  >
                    <CircleDollarSign size={15} aria-hidden />
                    {busy === "impact" ? "Allocating" : "Settle impact"}
                  </button>
                }
              />
              <div className="space-y-3 border-t border-[#e9e9e4] p-4">
                <p className="text-sm leading-6 text-[#6f686a]">
                  Sponsor capital is allocated after citation receipts prove which sources actually
                  supported the answer, creating a second creator reward beyond the read and citation tolls.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniMetric
                    label="Impact pool settled"
                    value={formatUsdc(metrics?.impactPoolUsdc ?? 0)}
                  />
                  <MiniMetric
                    label="Sources rewarded"
                    value={metrics?.sourcesWithImpactGrants ?? 0}
                  />
                </div>
                <div className="space-y-2">
                  {latestImpactGrants.slice(0, 4).map((grant) => (
                    <a
                      key={grant.id}
                      href={grant.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] px-3 py-2 transition hover:border-[#181818]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{grant.sourceTitle}</p>
                        <p className="mt-1 text-xs text-[#6f686a]">
                          {grant.impactScore} impact - {grant.creatorId}
                        </p>
                      </div>
                      <p className="font-mono text-sm font-semibold">
                        {formatUsdc(grant.amountUsdc)}
                      </p>
                    </a>
                  ))}
                  {latestImpactGrants.length === 0 ? (
                    <p className="rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] px-3 py-4 text-center text-sm text-[#6f686a]">
                      Run the settlement scenario or settle an answer, then allocate impact rewards.
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <Card id="sources">
              <CardHeader
                icon={<Database size={18} aria-hidden />}
                label="Catalog"
                title="Priced sources"
                action={
                  <label className="relative block w-full max-w-72">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8a85]"
                      aria-hidden
                    />
                    <input
                      value={sourceQuery}
                      onChange={(event) => setSourceQuery(event.target.value)}
                      placeholder="Search sources"
                      className="h-9 w-full rounded-lg border border-[#e0e0dc] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#181818]"
                    />
                  </label>
                }
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-t border-[#e9e9e4] text-sm">
                  <thead className="bg-[#f7f7f3] text-left text-xs font-medium uppercase text-[#6f686a]">
                    <tr>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Read toll</th>
                      <th className="px-4 py-3">Citation toll</th>
                      <th className="px-4 py-3">Range</th>
                      <th className="px-4 py-3">Split</th>
                      <th className="px-4 py-3">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9e9e4]">
                    {catalog.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="max-w-[360px] px-4 py-4">
                          <p className="font-medium text-[#181818]">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6f686a]">
                            {item.preview}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag}>{tag}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono font-semibold">
                          {formatUsdc(item.currentPriceUsdc)}
                        </td>
                        <td className="px-4 py-4 font-mono text-[#6f686a]">
                          {formatUsdc(item.citationPriceUsdc ?? item.currentPriceUsdc * 0.35)}
                        </td>
                        <td className="px-4 py-4 text-[#6f686a]">
                          {formatUsdc(item.minPriceUsdc)} - {formatUsdc(item.maxPriceUsdc)}
                        </td>
                        <td className="px-4 py-4 text-[#6f686a]">
                          {item.collaborators.length} collaborators
                        </td>
                        <td className="px-4 py-4">
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e0e0dc] text-[#6f686a] transition hover:border-[#181818] hover:text-[#181818]"
                            aria-label={`Open ${item.title}`}
                          >
                            <ExternalLink size={14} aria-hidden />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<Gauge size={18} aria-hidden />}
                label="Seller agent"
                title="Price movement"
              />
              <div className="space-y-4 p-4">
                {ledger?.catalog.map((item) => (
                  <div key={item.id}>
                    <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <p className="min-w-0 truncate text-sm font-medium">{item.title}</p>
                      <span className="font-mono text-xs text-[#6f686a]">
                        {formatUsdc(item.currentPriceUsdc)}
                      </span>
                    </div>
                    <div className="h-2 rounded-lg bg-[#e9e9e4]">
                      <div
                        className="h-2 rounded-lg bg-[#181818]"
                        style={{ width: `${Math.max(8, (item.currentPriceUsdc / maxPrice) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" id="ledger">
            <Card>
              <CardHeader
                icon={<Command size={18} aria-hidden />}
                label="Buyer decisions"
                title="Paid vs skipped"
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-t border-[#e9e9e4] text-sm">
                  <thead className="bg-[#f7f7f3] text-left text-xs font-medium uppercase text-[#6f686a]">
                    <tr>
                      <th className="px-4 py-3">Decision</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Toll</th>
                      <th className="px-4 py-3">Relevance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9e9e4]">
                    {allDecisions.length === 0 ? (
                      <tr>
                        <td className="px-4 py-8 text-center text-[#6f686a]" colSpan={4}>
                          Awaiting the next buyer-agent run.
                        </td>
                      </tr>
                    ) : (
                      allDecisions.map((decision) => (
                        <tr key={decision.itemId}>
                          <td className="px-4 py-4">
                            <StatusBadge status={decision.decision} />
                          </td>
                          <td className="max-w-[340px] px-4 py-4">
                            <p className="font-medium">{decision.title}</p>
                            <p className="mt-1 line-clamp-1 text-xs text-[#6f686a]">
                              {decision.reason}
                            </p>
                          </td>
                          <td className="px-4 py-4 font-mono">{formatUsdc(decision.priceUsdc)}</td>
                          <td className="px-4 py-4">{decision.relevanceScore}/100</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<ReceiptText size={18} aria-hidden />}
                label="Payment ledger"
                title="x402 settlements"
              />
              <div className="divide-y divide-[#e9e9e4] border-t border-[#e9e9e4]">
                {ledger?.payments.slice(0, 7).map((payment) => (
                  <a
                    key={payment.id}
                    href={payment.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 transition hover:bg-[#f7f7f3]"
                  >
                    <div>
                      <p className="line-clamp-1 text-sm font-medium">
                        {itemTitle(ledger, payment.itemId)}
                      </p>
                      <p className="mt-1 text-xs text-[#6f686a]">
                        {payment.kind} toll - {payment.gatewayTransferId} - {payment.settlementStatus}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-semibold">
                      {formatUsdc(payment.amountUsdc)}
                    </p>
                  </a>
                ))}
                {ledger?.payments.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-[#6f686a]">
                    No settlement records yet.
                  </p>
                ) : null}
              </div>
            </Card>
          </section>

          <section className="grid gap-5 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" id="gateway">
            <Card>
              <CardHeader
                icon={<Landmark size={18} aria-hidden />}
                label="Gateway"
                title="Arc proof"
              />
              <div className="space-y-3 p-4">
                <MiniMetric
                  label="Gateway balance"
                  value={`${ledger?.gatewayProof.fundedBalanceUsdc ?? 0} testnet USDC`}
                />
                <MiniMetric
                  label="Live paid request"
                  value={`${formatUsdc(ledger?.gatewayProof.liveX402Receipt.amountUsdc ?? 0)} ${ledger?.gatewayProof.liveX402Receipt.scheme ?? ""}`}
                />
                <CopyBox label="Agent wallet" value={ledger?.gatewayProof.agentWallet ?? "Not configured"} />
                <CopyBox
                  label="Live x402 payer"
                  value={ledger?.gatewayProof.liveX402Receipt.payer ?? "Pending"}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <ProofLink
                    label="Approval tx"
                    href={ledger?.gatewayProof.approvalExplorerUrl}
                    tx={ledger?.gatewayProof.approvalTx}
                  />
                  <ProofLink
                    label="Deposit tx"
                    href={ledger?.gatewayProof.depositExplorerUrl}
                    tx={ledger?.gatewayProof.depositTx}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<Split size={18} aria-hidden />}
                label="Royalty graph"
                title="Collaborator payouts"
              />
              <div className="divide-y divide-[#e9e9e4] border-t border-[#e9e9e4]">
                {ledger?.payoutSplits.slice(0, 8).map((split) => (
                  <a
                    key={split.id}
                    href={split.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 transition hover:bg-[#f7f7f3]"
                  >
                    <div>
                      <p className="text-sm font-medium">{split.splitBps / 100}% collaborator split</p>
                      <p className="mt-1 font-mono text-xs text-[#6f686a]">{split.creatorId}</p>
                    </div>
                    <p className="font-mono text-sm font-semibold">
                      {formatUsdc(split.amountUsdc)}
                    </p>
                  </a>
                ))}
                {ledger?.payoutSplits.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-[#6f686a]">
                    No collaborator payouts yet.
                  </p>
                ) : null}
              </div>
            </Card>
          </section>

          <section className="grid gap-5 pb-8 md:grid-cols-2">
            <Card>
              <CardHeader
                icon={<TrendingUp size={18} aria-hidden />}
                label="Pricing events"
                title="Seller-agent log"
              />
              <Timeline>
                {ledger?.pricingEvents.slice(0, 6).map((event) => (
                  <TimelineItem
                    key={event.id}
                    title={itemTitle(ledger, event.itemId)}
                    detail={`${formatUsdc(event.oldPriceUsdc)} -> ${formatUsdc(event.newPriceUsdc)} - ${event.reason}`}
                  />
                ))}
              </Timeline>
            </Card>

            <Card>
              <CardHeader
                icon={<GitBranch size={18} aria-hidden />}
                label="MCP catalog"
                title="Agent interface"
              />
              <div className="grid gap-2 p-4">
                {[
                  ["list_paid_sources", "Enumerate priced source previews"],
                  ["quote_source", "Return current x402 toll and split graph"],
                  ["buy_source", "Unlock a source through payment proof"],
                  ["finalize_answer_citations", "Settle citation tolls for cited paid sources"],
                  ["list_citation_receipts", "Inspect answer hashes and support spans"],
                  ["settle_impact_pool", "Allocate sponsor rewards to proven cited sources"],
                  ["get_publisher_kit", "Return RSS/Ghost publisher integration manifest"],
                  ["summarize_purchases", "Explain paid and skipped choices"],
                ].map(([tool, detail]) => (
                  <div
                    key={tool}
                    className="flex items-center justify-between gap-4 rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] px-3 py-2"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium">{tool}</p>
                      <p className="text-xs text-[#6f686a]">{detail}</p>
                    </div>
                    <Link2 size={15} className="shrink-0 text-[#8e8a85]" aria-hidden />
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}

function Card({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="min-w-0 rounded-lg border border-[#e0e0dc] bg-white shadow-sm">
      {children}
    </section>
  );
}

function CardHeader({
  icon,
  label,
  title,
  action,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#e6eaf0] bg-[#f7f7f3] text-[#6f686a]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-[#6f686a]">{label}</p>
          <h3 className="mt-0.5 break-words text-base font-semibold text-[#181818]">{title}</h3>
        </div>
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  trend: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-[#e0e0dc] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[#6f686a]">{label}</p>
          <p className="mt-2 break-words text-2xl font-semibold tabular-nums text-[#181818]">{value}</p>
        </div>
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf8f2] text-[#19c37d]">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 text-[#6f686a]">{detail}</span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#e0e0dc] px-2 py-1 font-medium text-[#2f2f2f]">
          <TrendingUp size={12} aria-hidden />
          {trend}
        </span>
      </div>
    </section>
  );
}

function ReviewStep({
  step,
  title,
  detail,
}: {
  step: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] p-3">
      <p className="font-mono text-xs font-semibold text-[#8e8a85]">{step}</p>
      <p className="mt-2 text-sm font-semibold text-[#181818]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#6f686a]">{detail}</p>
    </div>
  );
}

function RubricCard({
  item,
}: {
  item: {
    criterion: string;
    weightPct: number;
    coverage: "Strong" | "Needs proof" | "Needs live rail";
    evidence: string;
    fullMarksMove: string;
  };
}) {
  const strong = item.coverage === "Strong";
  return (
    <div className="rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#181818]">{item.criterion}</p>
          <p className="mt-1 text-xs font-medium uppercase text-[#6f686a]">Product surface</p>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
            strong
              ? "border-[#b7ead0] bg-[#edf8f2] text-[#127a52]"
              : "border-[#ead8ac] bg-[#fff8e5] text-[#856311]"
          }`}
        >
          {item.coverage}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#6f686a]">{item.evidence}</p>
      <p className="mt-3 border-t border-[#e9e9e4] pt-3 text-xs leading-5 text-[#6f686a]">
        <span className="font-semibold text-[#2f2f2f]">Next proof point:</span>{" "}
        {item.fullMarksMove}
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] px-3 py-2">
      <p className="text-xs font-medium uppercase text-[#6f686a]">{label}</p>
      <p className="mt-1 break-all font-mono text-sm font-semibold text-[#181818]">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[#e0e0dc] bg-white px-2 py-0.5 text-xs font-medium text-[#6f686a]">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: "paid" | "skipped" }) {
  const paid = status === "paid";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
        paid
          ? "border border-[#b7ead0] bg-[#edf8f2] text-[#127a52]"
          : "border border-[#ead8ac] bg-[#fff8e5] text-[#856311]"
      }`}
    >
      {paid ? <CheckCircle2 size={12} aria-hidden /> : <FileText size={12} aria-hidden />}
      {status}
    </span>
  );
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-md border border-[#b7ead0] bg-[#edf8f2] px-2 py-1 text-xs font-medium capitalize text-[#127a52]">
      {children}
    </span>
  );
}

function ProofLink({ label, href, tx }: { label: string; href?: string; tx?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] px-3 py-2 transition hover:border-[#181818]"
    >
      <p className="text-xs font-medium uppercase text-[#6f686a]">{label}</p>
      <p className="mt-1 flex items-center gap-2 font-mono text-xs font-semibold text-[#181818]">
        {tx ? shortHash(tx) : "Not configured"}
        <ExternalLink size={12} aria-hidden />
      </p>
    </a>
  );
}

function CopyBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e9e9e4] bg-[#fbfbf8] px-3 py-2">
      <p className="text-xs font-medium uppercase text-[#6f686a]">{label}</p>
      <p className="mt-1 break-all font-mono text-xs font-semibold text-[#181818]">{value}</p>
    </div>
  );
}

function Timeline({ children }: { children: ReactNode }) {
  return <div className="space-y-3 border-t border-[#e9e9e4] p-4">{children}</div>;
}

function TimelineItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid grid-cols-[12px_1fr] gap-3">
      <div className="mt-1.5 size-2 rounded-md bg-[#181818]" />
      <div>
        <p className="line-clamp-1 text-sm font-medium text-[#181818]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#6f686a]">{detail}</p>
      </div>
    </div>
  );
}
