import { makeHash } from "./charon";
import { getLedgerSnapshot } from "./ledger";
import { getStore } from "./store";
import type { TesterAttestation } from "./types";

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeQuote(quote?: string) {
  const trimmed = quote?.trim();
  if (trimmed) {
    return trimmed.slice(0, 240);
  }

  return "I ran the Kleos settlement scenario and could inspect the proof trail.";
}

function githubIssueUrl(attestation: Omit<TesterAttestation, "githubIssueUrl">) {
  const title = encodeURIComponent(`Tester attestation: ${attestation.testerName}`);
  const body = encodeURIComponent(
    [
      "## Kleos tester attestation",
      "",
      `- Tester: ${attestation.testerName}`,
      `- Role: ${attestation.testerRole}`,
      `- Scenario run: ${attestation.scenarioRun ? "yes" : "no"}`,
      `- Useful: ${attestation.useful ? "yes" : "no"}`,
      `- Contact/wallet: ${attestation.walletOrContact ?? "not provided"}`,
      `- Live URL: ${attestation.liveUrl}`,
      `- Proof hash: ${attestation.proofHash}`,
      "",
      "Quote:",
      `> ${attestation.quote}`,
    ].join("\n"),
  );

  return `https://github.com/shobhit1kapoor/kleos-agent-priced-toll-gates/issues/new?title=${title}&body=${body}&labels=tester-attestation`;
}

export function createTesterAttestation(input: {
  testerName?: string;
  testerRole?: TesterAttestation["testerRole"];
  scenarioRun?: boolean;
  useful?: boolean;
  quote?: string;
  walletOrContact?: string;
  liveUrl?: string;
}) {
  const store = getStore();
  const ledger = getLedgerSnapshot();
  const id = makeId("test");
  const testerName = input.testerName?.trim().slice(0, 80) || `Tester ${store.testerAttestations.length + 1}`;
  const attestationBase: Omit<TesterAttestation, "githubIssueUrl"> = {
    id,
    testerName,
    testerRole: input.testerRole ?? "builder",
    scenarioRun: input.scenarioRun ?? true,
    useful: input.useful ?? true,
    quote: normalizeQuote(input.quote),
    walletOrContact: input.walletOrContact?.trim().slice(0, 120) || undefined,
    liveUrl: input.liveUrl ?? "https://kleos-agent-priced-toll-gates.vercel.app",
    proofHash: makeHash(
      JSON.stringify({
        id,
        testerName,
        metrics: ledger.metrics,
        liveX402Receipt: ledger.gatewayProof.liveX402Receipt.receiptId,
      }),
    ),
    createdAt: new Date().toISOString(),
  };
  const attestation: TesterAttestation = {
    ...attestationBase,
    githubIssueUrl: githubIssueUrl(attestationBase),
  };

  store.testerAttestations.unshift(attestation);

  return {
    attestation,
    totals: getTractionSnapshot().totals,
  };
}

export function getTractionSnapshot() {
  const store = getStore();

  return {
    attestations: store.testerAttestations,
    totals: {
      testerAttestations: store.testerAttestations.length,
      scenarioRunsAttested: store.testerAttestations.filter((entry) => entry.scenarioRun).length,
      usefulVotes: store.testerAttestations.filter((entry) => entry.useful).length,
      creatorOrBuilderAttestations: store.testerAttestations.filter((entry) =>
        ["creator", "builder", "agent-operator"].includes(entry.testerRole),
      ).length,
    },
    testerInstructions: [
      "Open the production app.",
      "Click Run scenario.",
      "Open /api/answers/proof and confirm the live x402 receipt appears.",
      "Submit this attestation or open the generated GitHub issue URL.",
    ],
  };
}
