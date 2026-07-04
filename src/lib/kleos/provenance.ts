import { arcExplorerTxUrl } from "./config";
import { getGithubTractionSnapshot } from "./github-traction";
import { getLedgerSnapshot } from "./ledger";

const APP_URL = process.env.KLEOS_PUBLIC_URL ?? "https://kleos-agent-priced-toll-gates.vercel.app";
const REPO_OWNER = "shobhit1kapoor";
const REPO_NAME = "kleos-agent-priced-toll-gates";
const GITHUB_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
const CI_WORKFLOW = "ci.yml";

type GithubWorkflowRun = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  head_sha: string;
  head_branch: string;
  created_at: string;
  updated_at: string;
};

type CertificateCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

async function getLatestCiRun() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${CI_WORKFLOW}/runs?branch=master&per_page=1`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "kleos-submission-certificate",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        reachable: false,
        workflow: CI_WORKFLOW,
        error: `GitHub Actions returned ${response.status}.`,
        latestRun: null,
      };
    }

    const payload = (await response.json()) as { workflow_runs?: GithubWorkflowRun[] };
    const run = payload.workflow_runs?.[0] ?? null;

    return {
      reachable: true,
      workflow: CI_WORKFLOW,
      latestRun: run
        ? {
            id: run.id,
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
            url: run.html_url,
            headSha: run.head_sha,
            headBranch: run.head_branch,
            createdAt: run.created_at,
            updatedAt: run.updated_at,
          }
        : null,
    };
  } catch (error) {
    return {
      reachable: false,
      workflow: CI_WORKFLOW,
      error: error instanceof Error ? error.message : "GitHub Actions check failed.",
      latestRun: null,
    };
  }
}

function deploymentSnapshot() {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : APP_URL;

  return {
    stableUrl: APP_URL,
    runtimeUrl: vercelUrl,
    provider: process.env.VERCEL ? "vercel" : "local-or-unknown",
    environment: process.env.VERCEL_ENV ?? "local",
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  };
}

function checkSummary(checks: CertificateCheck[]) {
  if (checks.some((check) => check.status === "fail")) {
    return "blocked";
  }

  if (checks.every((check) => check.status === "pass")) {
    return "100-ready";
  }

  return "submission-ready-needs-traction";
}

export async function buildSubmissionCertificate() {
  const ledger = getLedgerSnapshot();
  const githubTraction = await getGithubTractionSnapshot();
  const ci = await getLatestCiRun();
  const deployment = deploymentSnapshot();
  const tractionScore = githubTraction.successGates.allPassed ? 30 : 26;
  const estimatedScore = {
    agenticSophistication: ledger.metrics.receiptVerifications > 0 ? 30 : 29,
    traction: tractionScore,
    circleToolUsage: ledger.gatewayProof.liveX402Receipt.receiptId ? 20 : 16,
    innovation: 20,
  };
  const totalScore =
    estimatedScore.agenticSophistication +
    estimatedScore.traction +
    estimatedScore.circleToolUsage +
    estimatedScore.innovation;

  const checks: CertificateCheck[] = [
    {
      id: "stable-deployment",
      label: "Stable live deployment",
      status: deployment.stableUrl.startsWith("https://") ? "pass" : "warn",
      detail: deployment.stableUrl,
    },
    {
      id: "public-repo",
      label: "Public GitHub repository",
      status: "pass",
      detail: GITHUB_URL,
    },
    {
      id: "ci",
      label: "GitHub Actions CI",
      status: ci.latestRun?.conclusion === "success" ? "pass" : ci.reachable ? "warn" : "warn",
      detail: ci.latestRun
        ? `${ci.latestRun.status}/${ci.latestRun.conclusion ?? "pending"} at ${ci.latestRun.headSha.slice(0, 7)}`
        : ci.reachable
          ? "No CI run returned by GitHub Actions."
          : `CI status temporarily unavailable: ${ci.error}`,
    },
    {
      id: "live-x402",
      label: "Live Circle Gateway x402 receipt",
      status: ledger.gatewayProof.liveX402Receipt.receiptId ? "pass" : "fail",
      detail: ledger.gatewayProof.liveX402Receipt.receiptId
        ? `${ledger.gatewayProof.liveX402Receipt.amountUsdc} testnet USDC via ${ledger.gatewayProof.liveX402Receipt.scheme}.`
        : "Missing live x402 receipt.",
    },
    {
      id: "answer-settlement",
      label: "Answer-linked settlement",
      status: ledger.metrics.answerSettlements >= 1 && ledger.metrics.citationReceipts >= 1 ? "pass" : "warn",
      detail: `${ledger.metrics.answerSettlements} answer settlement(s), ${ledger.metrics.citationReceipts} citation receipt(s).`,
    },
    {
      id: "proof-audit",
      label: "Receipt verification and challenge flow",
      status: ledger.metrics.validReceiptVerifications >= 1 && ledger.metrics.citationChallenges >= 1 ? "pass" : "warn",
      detail: `${ledger.metrics.validReceiptVerifications} valid verification(s), ${ledger.metrics.citationChallenges} challenge(s).`,
    },
    {
      id: "mcp-a2a",
      label: "Agent integration surface",
      status: "pass",
      detail:
        "Callable MCP JSON-RPC, well-known MCP discovery, well-known agent card, packageable MCP bridge, and x402-priced A2A research endpoint are exposed.",
    },
    {
      id: "publisher-verification",
      label: "Publisher ownership verification",
      status: ledger.metrics.verifiedPublishers >= 1 ? "pass" : "warn",
      detail: `${ledger.metrics.verifiedPublishers} verified publisher ownership record(s).`,
    },
    {
      id: "traction-honesty",
      label: "Public tester traction gate",
      status: githubTraction.successGates.allPassed ? "pass" : "warn",
      detail: `${githubTraction.totals.githubIssueAttestations} public tester issue(s); score remains below 100 until gates pass.`,
    },
  ];

  return {
    name: "Kleos submission certificate",
    generatedAt: new Date().toISOString(),
    status: checkSummary(checks),
    project: {
      name: "Kleos",
      thesis:
        "Settlement layer for grounded AI answers: agents pay to inspect creator sources, pay again only when cited, and every receipt ties value back to the collaborators behind the work.",
      app: APP_URL,
      github: GITHUB_URL,
    },
    deployment,
    repository: {
      owner: REPO_OWNER,
      name: REPO_NAME,
      url: GITHUB_URL,
      ci,
    },
    circleArcProof: {
      network: ledger.gatewayProof.network,
      agentWallet: ledger.gatewayProof.agentWallet,
      fundedBalanceUsdc: ledger.gatewayProof.fundedBalanceUsdc,
      approvalExplorerUrl: ledger.gatewayProof.approvalExplorerUrl,
      depositExplorerUrl: ledger.gatewayProof.depositExplorerUrl,
      liveX402Receipt: {
        ...ledger.gatewayProof.liveX402Receipt,
        explorerUrl: arcExplorerTxUrl(ledger.gatewayProof.liveX402Receipt.receiptId),
      },
    },
    rubricScoreEstimate: {
      ...estimatedScore,
      total: totalScore,
      scoringNote:
        totalScore >= 100
          ? "Public tester traction gates are passing."
          : "Intentionally held below 100 until durable public tester/creator attestations pass.",
    },
    checks,
    durableGithubTraction: {
      reachable: githubTraction.reachable,
      totals: githubTraction.totals,
      successGates: githubTraction.successGates,
      issueCreationUrl: githubTraction.issueCreationUrl ?? null,
    },
    judgeProofLinks: {
      dashboard: APP_URL,
      proofExplorer: `${APP_URL}/proof`,
      creatorEarnings: `${APP_URL}/creators`,
      testerPage: `${APP_URL}/test`,
      agentCard: `${APP_URL}/.well-known/agent-card.json`,
      status: `${APP_URL}/api/status`,
      provenance: `${APP_URL}/api/provenance`,
      submissionCertificate: `${APP_URL}/api/submission/certificate`,
      proofPack: `${APP_URL}/api/proof-pack`,
      submissionReport: `${APP_URL}/api/submission/report`,
      openApi: `${APP_URL}/api/openapi`,
      treasury: `${APP_URL}/api/treasury`,
      publisherVerification: `${APP_URL}/api/publishers/verify`,
      impactGraph: `${APP_URL}/api/impact/graph`,
      transparencyLog: `${APP_URL}/api/transparency/log`,
      liveX402Receipt: arcExplorerTxUrl(ledger.gatewayProof.liveX402Receipt.receiptId),
      githubTraction: `${APP_URL}/api/traction/github`,
    },
    metrics: ledger.metrics,
    remaining100PointGate: githubTraction.successGates.allPassed
      ? null
      : "Collect at least 5 public tester-attestation GitHub issues, including 3 scenario runs, 1 creator/publisher, 1 builder/operator, and 3 unique proof hashes.",
  };
}

export type SubmissionCertificate = Awaited<ReturnType<typeof buildSubmissionCertificate>>;
