import { getGithubTractionSnapshot } from "./github-traction";
import { buildTractionCampaign } from "./traction";
import type { TesterAttestation } from "./types";

const roleDefaults: Record<
  TesterAttestation["testerRole"],
  {
    label: string;
    testerName: string;
    quote: string;
    priority: string;
  }
> = {
  builder: {
    label: "Builder",
    testerName: "Arc builder tester",
    quote: "I ran the Kleos scenario and could inspect the settlement proof trail.",
    priority: "Confirms the product is understandable to other builders and counts toward the builder/operator gate.",
  },
  creator: {
    label: "Creator",
    testerName: "Creator tester",
    quote: "Kleos made the creator payout, citation receipt, and cash-out flow understandable.",
    priority: "Closes the creator/publisher gate and directly supports the Lepton creator monetization story.",
  },
  publisher: {
    label: "Publisher",
    testerName: "Publisher tester",
    quote: "Kleos made source ownership, paid access, and creator split settlement understandable.",
    priority: "Counts as creator-side traction and proves the publisher onboarding path is legible.",
  },
  "agent-operator": {
    label: "Agent operator",
    testerName: "Agent operator tester",
    quote: "The Kleos API surfaces were clear enough for another agent to discover, buy, cite, and verify sources.",
    priority: "Confirms MCP/A2A/API usefulness and counts toward the builder/operator gate.",
  },
  judge: {
    label: "Judge reviewer",
    testerName: "Judge-path reviewer",
    quote: "The Kleos judge path showed read tolls, citation tolls, proof hashes, and creator settlement evidence.",
    priority: "Useful for async review, but creator and builder/operator attestations are higher priority right now.",
  },
  other: {
    label: "General tester",
    testerName: "Kleos tester",
    quote: "I ran the Kleos settlement flow and could inspect the proof trail.",
    priority: "Adds durable tester count and unique proof-hash evidence.",
  },
};

export function isTesterRole(value: unknown): value is TesterAttestation["testerRole"] {
  return typeof value === "string" && value in roleDefaults;
}

function inviteUrl(origin: string, role: TesterAttestation["testerRole"], name?: string, quote?: string) {
  const defaults = roleDefaults[role];
  const params = new URLSearchParams({
    role,
    name: name?.trim() || defaults.testerName,
    quote: quote?.trim() || defaults.quote,
  });

  return `${origin}/test?${params.toString()}`;
}

function oneClickCurl(origin: string, role: TesterAttestation["testerRole"], name?: string, quote?: string) {
  const defaults = roleDefaults[role];
  const body = JSON.stringify({
    testerName: name?.trim() || defaults.testerName,
    testerRole: role,
    quote: quote?.trim() || defaults.quote,
  }).replaceAll('"', '\\"');

  return `curl -X POST ${origin}/api/tester/one-click -H "Content-Type: application/json" -d "${body}"`;
}

function neededRoles(snapshot: Awaited<ReturnType<typeof getGithubTractionSnapshot>>) {
  const roles: Array<TesterAttestation["testerRole"]> = [];

  if (!snapshot.successGates.creatorOrPublisher) {
    roles.push("creator");
  }
  if (!snapshot.successGates.builderOrOperator) {
    roles.push("builder", "agent-operator");
  }
  if (!snapshot.successGates.threeScenarioRuns || !snapshot.successGates.fivePublicAttestations) {
    roles.push("judge", "other");
  }

  return Array.from(new Set(roles));
}

export async function buildTesterInvitePacket(
  origin: string,
  input: {
    role?: string;
    testerName?: string;
    quote?: string;
  } = {},
) {
  const role = isTesterRole(input.role) ? input.role : "builder";
  const githubTraction = await getGithubTractionSnapshot();
  const campaign = buildTractionCampaign(origin);
  const rolesNeeded = neededRoles(githubTraction);
  const selectedInviteUrl = inviteUrl(origin, role, input.testerName, input.quote);

  return {
    name: "Kleos tester invite packet",
    purpose:
      "Give a real tester one role-specific URL that runs the no-wallet scenario, mints a proof hash, and opens a public GitHub attestation issue.",
    selectedRole: {
      role,
      label: roleDefaults[role].label,
      whyThisMatters: roleDefaults[role].priority,
    },
    inviteUrl: selectedInviteUrl,
    copyBlocks: {
      shortDm: `Can you test Kleos for 90 seconds? Open ${selectedInviteUrl}, click Run tester flow, then submit the generated GitHub issue so the proof is public.`,
      discord:
        `Looking for a ${roleDefaults[role].label.toLowerCase()} to test Kleos. It runs a no-wallet agent settlement scenario, verifies a receipt, and creates a GitHub attestation proof hash. Start here: ${selectedInviteUrl}`,
      xPost:
        `Kleos needs public tester attestations for Lepton. Run the no-wallet settlement scenario, inspect the proof trail, and publish the generated GitHub issue: ${selectedInviteUrl}`,
    },
    directApi: {
      endpoint: `${origin}/api/tester/one-click`,
      curl: oneClickCurl(origin, role, input.testerName, input.quote),
    },
    githubTraction: {
      totals: githubTraction.totals,
      successGates: githubTraction.successGates,
      issueCreationUrl: githubTraction.issueCreationUrl,
      rolesNeeded,
    },
    recommendedBatch: rolesNeeded.slice(0, 5).map((neededRole) => {
      const roleInviteUrl = inviteUrl(origin, neededRole);

      return {
        role: neededRole,
        label: roleDefaults[neededRole].label,
        inviteUrl: roleInviteUrl,
        shortDm: `Can you test Kleos as a ${roleDefaults[neededRole].label.toLowerCase()}? Run this and submit the generated GitHub issue: ${roleInviteUrl}`,
      };
    }),
    campaignLinks: campaign.links,
    nextStep: githubTraction.successGates.allPassed
      ? "Public tester gates are already verified. Keep this packet as an easy way to collect additional backup attestations."
      : "Send the recommendedBatch links to real testers. The score only reaches 100 after the generated GitHub issues are submitted publicly and /api/traction/github verifies the gates.",
  };
}
