import { makeHash } from "./charon";
import { getLedgerSnapshot } from "./ledger";
import { getStore } from "./store";
import type { TesterAttestation } from "./types";

const DEFAULT_PUBLIC_URL = "https://kleos-agent-priced-toll-gates.vercel.app";

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
    liveUrl: input.liveUrl ?? DEFAULT_PUBLIC_URL,
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

function roleAttestationPayload(
  role: TesterAttestation["testerRole"],
  testerName: string,
  quote: string,
) {
  return {
    testerName,
    testerRole: role,
    scenarioRun: true,
    useful: true,
    quote,
    liveUrl: DEFAULT_PUBLIC_URL,
  };
}

function encodeJson(data: unknown) {
  return JSON.stringify(data).replaceAll('"', '\\"');
}

export function buildTractionCampaign(origin = DEFAULT_PUBLIC_URL) {
  const snapshot = getTractionSnapshot();
  const ledger = getLedgerSnapshot();
  const remainingAttestations = Math.max(0, 5 - snapshot.totals.testerAttestations);
  const roles: Array<{
    role: TesterAttestation["testerRole"];
    label: string;
    ask: string;
    payload: ReturnType<typeof roleAttestationPayload>;
  }> = [
    {
      role: "builder",
      label: "Arc builder",
      ask: "Run the scenario, inspect the proof pack, and leave one sentence on whether the receipt trail is understandable.",
      payload: roleAttestationPayload(
        "builder",
        "Arc builder tester",
        "I ran the Kleos scenario and could inspect the settlement proof trail.",
      ),
    },
    {
      role: "creator",
      label: "Creator or publisher",
      ask: "Check whether the creator payout, split, webhook, and cash-out story makes sense for your content.",
      payload: roleAttestationPayload(
        "creator",
        "Creator tester",
        "Kleos made the creator payout and citation receipt flow understandable.",
      ),
    },
    {
      role: "agent-operator",
      label: "Agent operator",
      ask: "Inspect the MCP, catalog, x402 402 challenge, and receipt verifier as if wiring another agent into Kleos.",
      payload: roleAttestationPayload(
        "agent-operator",
        "Agent operator tester",
        "The Kleos API surfaces were clear enough for another agent to discover, buy, cite, and verify sources.",
      ),
    },
    {
      role: "judge",
      label: "Judge reviewer",
      ask: "Use the one-click path, then open proof-pack, answer proof, receipt verifier, and competitive positioning.",
      payload: roleAttestationPayload(
        "judge",
        "Judge-path reviewer",
        "The Kleos judge path showed read tolls, citation tolls, proof hashes, and creator settlement evidence.",
      ),
    },
  ];

  const links = {
    app: origin,
    proofPack: `${origin}/api/proof-pack`,
    answerProof: `${origin}/api/answers/proof`,
    receiptVerifier: `${origin}/api/receipts/verify?latest=true`,
    citationChallenge: `${origin}/api/citations/challenge`,
    competitivePositioning: `${origin}/api/competitive/positioning`,
    attestationEndpoint: `${origin}/api/traction/attest`,
    githubIssues: "https://github.com/shobhit1kapoor/kleos-agent-priced-toll-gates/issues",
  };

  return {
    name: "Kleos tester traction campaign",
    purpose:
      "Turn the remaining traction gap into a repeatable tester flow with proof hashes and public GitHub feedback.",
    currentScorePath: {
      currentEstimate: ledger.metrics.testerAttestations >= 5 ? 100 : 96,
      targetEstimate: 100,
      remainingAttestations,
      reason:
        remainingAttestations === 0
          ? "Five or more tester attestations are present."
          : `${remainingAttestations} more real tester attestation${
              remainingAttestations === 1 ? "" : "s"
            } needed to close the traction gap honestly.`,
    },
    successGates: [
      "At least 5 tester attestations from builders, creators, agent operators, or judges.",
      "At least 3 attestations marked scenarioRun=true.",
      "At least 1 creator or publisher attestation.",
      "At least 1 agent-operator or builder attestation.",
      "At least 1 public GitHub issue created from an attestation URL.",
    ],
    testerFlow: [
      "Open the live app.",
      "Click Run scenario.",
      "Open the latest answer proof and proof pack.",
      "Open the receipt verifier and confirm the live x402-backed receipt appears.",
      "Click Attest or POST the role-specific payload below.",
      "Open the generated GitHub issue URL so the feedback is public.",
    ],
    links,
    roleSpecificAsks: roles.map((role) => ({
      label: role.label,
      ask: role.ask,
      payload: role.payload,
      curl: `curl -X POST ${links.attestationEndpoint} -H "Content-Type: application/json" -d "${encodeJson(
        role.payload,
      )}"`,
    })),
    discordCopy:
      "Can 3-5 Arc/Canteen builders test Kleos for 90 seconds? Open the app, click Run scenario, inspect /api/proof-pack and /api/receipts/verify, then click Attest. Kleos pays sources when agents inspect them, pays again only when cited, verifies receipt integrity, and shows creator splits/cash-outs. Live: " +
      origin,
    xCopy:
      "Kleos is live for Lepton: a settlement layer for grounded AI answers. Agents pay read tolls, pay citation tolls only for sources used in final answers, split payouts to collaborators, verify receipts, and expose a proof pack. Test it here: " +
      origin,
    submissionCopy:
      `Current traction: ${snapshot.totals.testerAttestations} tester attestations, ${snapshot.totals.scenarioRunsAttested} scenario runs attested, ${snapshot.totals.creatorOrBuilderAttestations} creator/builder/operator attestations. Target before final submission: 5 external attestations plus public GitHub feedback issues.`,
  };
}
