import { makeHash } from "./charon";
import { buildProofPack } from "./proof-pack";
import { buildSubmissionCertificate } from "./provenance";
import { buildSubmissionReport } from "./submission";
import { buildTesterInvitePacket } from "./traction-invite";
import { getGithubTractionSnapshot } from "./github-traction";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }

  return value;
}

export async function buildSubmissionBundle(origin: string) {
  const [certificate, githubTraction, creatorInvite, builderInvite, operatorInvite] = await Promise.all([
    buildSubmissionCertificate(),
    getGithubTractionSnapshot(),
    buildTesterInvitePacket(origin, { role: "creator" }),
    buildTesterInvitePacket(origin, { role: "builder" }),
    buildTesterInvitePacket(origin, { role: "agent-operator" }),
  ]);
  const proofPack = buildProofPack(origin);
  const report = buildSubmissionReport();
  const liveX402Receipt = certificate.circleArcProof.liveX402Receipt;
  const bundleCore = {
    generatedAt: new Date().toISOString(),
    project: certificate.project,
    status: certificate.status,
    score: certificate.rubricScoreEstimate,
    deployment: certificate.deployment,
    liveX402Receipt,
    tractionGates: githubTraction.successGates,
    differentiatorCount: proofPack.strongestDifferentiators.length,
  };
  const bundleHash = makeHash(JSON.stringify(canonicalize(bundleCore)));

  return {
    name: "Kleos submission evidence bundle",
    bundleHash,
    ...bundleCore,
    formFields: {
      projectName: "Kleos",
      oneLine:
        "Kleos is the settlement layer for grounded AI answers: agents pay read tolls, pay citation tolls only for cited sources, and split every payment to the creators behind the work.",
      category: report.project.category,
      primaryRfb: report.project.primaryRfb,
      supportingRfbs: report.project.supportingRfbs,
      liveUrl: certificate.project.app,
      githubUrl: certificate.project.github,
      proofExplorer: certificate.judgeProofLinks.proofExplorer,
      creatorEarnings: certificate.judgeProofLinks.creatorEarnings,
      proofPack: certificate.judgeProofLinks.proofPack,
      submissionCertificate: certificate.judgeProofLinks.submissionCertificate,
      liveX402ReceiptUrl: certificate.judgeProofLinks.liveX402Receipt,
    },
    judgeRunbook: [
      "Open the live dashboard and click Run scenario.",
      "Open /proof to see the x402 receipt, score certificate, transparency root, and traction gates.",
      "Open /api/proof-pack to inspect differentiators, receipts, claim traces, impact graph, spend permits, and proof links.",
      "Open /api/agents/spend-permits?permitId=permit_seed_judge_agent to verify external-agent spend limits.",
      "Open /creators to inspect read toll splits, citation toll splits, impact rewards, and cash-outs.",
      "Open /api/traction/github to verify whether public tester gates have passed.",
    ],
    demoScriptUnder3Min: [
      {
        seconds: "0-20",
        beat: "Problem",
        narration:
          "AI agents use creator work to produce answers, but the humans behind those sources rarely get paid.",
      },
      {
        seconds: "20-55",
        beat: "Inspect and buy",
        narration:
          "Kleos lets a buyer agent compare paid sources under a budget, pay read tolls through x402-style settlement, and skip overpriced sources.",
      },
      {
        seconds: "55-95",
        beat: "Cite and settle",
        narration:
          "Only sources actually used in the final answer receive second-stage citation tolls, answer-linked receipts, and collaborator split payouts.",
      },
      {
        seconds: "95-135",
        beat: "Audit and control",
        narration:
          "Judges can verify claim traces, receipt checks, transparency roots, spend permits, publisher ownership, and creator earnings.",
      },
      {
        seconds: "135-170",
        beat: "Traction path",
        narration:
          "Public tester invite links produce proof hashes and GitHub attestations; the score stays below 100 until real public gates pass.",
      },
    ],
    testerRecruitment: {
      currentGithubTraction: githubTraction.totals,
      successGates: githubTraction.successGates,
      creatorInvite: {
        inviteUrl: creatorInvite.inviteUrl,
        shortDm: creatorInvite.copyBlocks.shortDm,
      },
      builderInvite: {
        inviteUrl: builderInvite.inviteUrl,
        shortDm: builderInvite.copyBlocks.shortDm,
      },
      agentOperatorInvite: {
        inviteUrl: operatorInvite.inviteUrl,
        shortDm: operatorInvite.copyBlocks.shortDm,
      },
    },
    proofLinks: {
      ...certificate.judgeProofLinks,
      spendPermit: `${origin}/api/agents/spend-permits?permitId=permit_seed_judge_agent`,
      submissionBundle: `${origin}/api/submission/bundle`,
    },
    proofDigest: {
      differentiators: proofPack.strongestDifferentiators,
      metrics: proofPack.metrics,
      spendPermits: proofPack.spendPermits,
      transparencyRoot: proofPack.transparencyLog.rootHash,
      impactGraphHash: proofPack.impactGraph.graphHash,
    },
    honestyNote:
      "Kleos does not claim 100/100 until durable public GitHub tester attestations pass. The current score remains intentionally below 100 when those gates are incomplete.",
    nextBestAction:
      githubTraction.successGates.allPassed
        ? "Record and submit the final demo."
        : "Send the creator, builder, and agent-operator invite links to real testers, then verify submitted GitHub issues through /api/traction/github.",
  };
}

export type SubmissionBundle = Awaited<ReturnType<typeof buildSubmissionBundle>>;
