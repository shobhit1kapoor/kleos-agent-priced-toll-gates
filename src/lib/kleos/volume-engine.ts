import { makeHash } from "./charon";
import { KLEOS_AGENT_WALLET } from "./config";
import { getLedgerSnapshot } from "./ledger";
import { runSponsoredTrial } from "./sponsored-trial";
import { getStore } from "./store";
import type { AutonomousVolumeRun } from "./types";

const DEFAULT_TASKS = [
  "Compare creator monetization, citation tolls, and Gateway settlement for an AI answer.",
  "Explain why answer-linked receipts are stronger than generic x402 read payments.",
  "Evaluate whether publisher RSS intake, source ownership, and collaborator splits are enough for creator adoption.",
  "Inspect Kleos proof surfaces as an external agent operator deciding whether to call the A2A endpoint.",
  "Assess whether dynamic source pricing should react to citation confidence and skipped demand.",
  "Summarize how bounded spend permits protect an autonomous buyer agent from overspending.",
];

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampRuns(value: unknown) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 3;
  return Math.min(Math.max(parsed, 1), 12);
}

function roundUsdc(value: number) {
  return Number(value.toFixed(6));
}

export function volumeEngineSummary() {
  const store = getStore();
  const ledger = getLedgerSnapshot();
  const totalReadTollUsdc = store.autonomousVolumeRuns.reduce(
    (sum, run) => sum + run.totalReadTollUsdc,
    0,
  );
  const totalCitationTollUsdc = store.autonomousVolumeRuns.reduce(
    (sum, run) => sum + run.totalCitationTollUsdc,
    0,
  );
  const impactPoolUsdc = store.autonomousVolumeRuns.reduce((sum, run) => sum + run.impactPoolUsdc, 0);
  const completedRuns = store.autonomousVolumeRuns.reduce((sum, run) => sum + run.completedRuns, 0);
  const sessionCount = store.autonomousVolumeRuns.reduce((sum, run) => sum + run.sessions.length, 0);
  const citationReceipts = store.autonomousVolumeRuns.reduce(
    (sum, run) => sum + run.sessions.reduce((inner, session) => inner + session.citationReceipts, 0),
    0,
  );

  return {
    name: "Kleos autonomous volume engine",
    status: store.autonomousVolumeRuns.length > 0 ? "active-current-runtime" : "ready",
    honesty:
      "These are internally generated autonomous agent runs in the current runtime. They prove repeatable agent payment flow, but they do not count as external tester traction.",
    currentRuntimeTotals: {
      volumeBatches: store.autonomousVolumeRuns.length,
      completedRuns,
      sessions: sessionCount,
      citationReceipts,
      readTollUsdc: roundUsdc(totalReadTollUsdc),
      citationTollUsdc: roundUsdc(totalCitationTollUsdc),
      impactPoolUsdc: roundUsdc(impactPoolUsdc),
      totalAgentGeneratedUsdc: roundUsdc(totalReadTollUsdc + totalCitationTollUsdc + impactPoolUsdc),
    },
    ledgerTotalsAfterVolume: ledger.metrics,
    latestRuns: store.autonomousVolumeRuns.slice(0, 8),
    nextStep:
      "POST a targetRuns value from 1 to 12 to generate a new labeled internal volume batch.",
  };
}

export function runAutonomousVolumeEngine(input?: { targetRuns?: number; taskPrefix?: string }) {
  const store = getStore();
  const requestedRuns = clampRuns(input?.targetRuns);
  const startedAt = new Date().toISOString();
  const sessions: AutonomousVolumeRun["sessions"] = [];
  let totalReadTollUsdc = 0;
  let totalCitationTollUsdc = 0;
  let impactPoolUsdc = 0;

  for (let index = 0; index < requestedRuns; index += 1) {
    const task = `${input?.taskPrefix?.trim() || "Kleos autonomous volume run"}: ${
      DEFAULT_TASKS[index % DEFAULT_TASKS.length]
    }`;
    const trial = runSponsoredTrial({
      task,
      budgetUsdc: 0.018 + (index % 3) * 0.002,
      citationBudgetUsdc: 0.006,
      sponsorPoolUsdc: 0.006 + (index % 2) * 0.002,
    });
    const readTollUsdc = trial.citations.settlement.readTollUsdc;
    const citationTollUsdc = trial.citations.settlement.citationTollUsdc;
    const impactUsdc = trial.impact.sponsorPoolUsdc;

    totalReadTollUsdc = roundUsdc(totalReadTollUsdc + readTollUsdc);
    totalCitationTollUsdc = roundUsdc(totalCitationTollUsdc + citationTollUsdc);
    impactPoolUsdc = roundUsdc(impactPoolUsdc + impactUsdc);

    sessions.push({
      sessionId: trial.research.session.id,
      answerHash: trial.citations.settlement.answerHash,
      paidReads: trial.research.decisions.filter((decision) => decision.decision === "paid").length,
      citationReceipts: trial.citations.citationReceipts.length,
      spentUsdc: roundUsdc(readTollUsdc + citationTollUsdc + impactUsdc),
    });
  }

  const completedAt = new Date().toISOString();
  const run: AutonomousVolumeRun = {
    id: makeId("vol"),
    mode: "internal-agent-volume",
    requestedRuns,
    completedRuns: sessions.length,
    buyerWallet: KLEOS_AGENT_WALLET,
    totalReadTollUsdc,
    totalCitationTollUsdc,
    impactPoolUsdc,
    totalUsdcMoved: roundUsdc(totalReadTollUsdc + totalCitationTollUsdc + impactPoolUsdc),
    sessions,
    proofHash: makeHash(JSON.stringify({ requestedRuns, sessions, startedAt, completedAt })),
    note:
      "Internal autonomous volume batch: buyer agents repeatedly inspected sources, paid read tolls, finalized citation tolls, and allocated impact rewards. This is not external user traction.",
    startedAt,
    completedAt,
  };

  store.autonomousVolumeRuns.unshift(run);

  return {
    run,
    summary: volumeEngineSummary(),
  };
}
