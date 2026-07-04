const REPO_OWNER = "shobhit1kapoor";
const REPO_NAME = "kleos-agent-priced-toll-gates";
const LABEL = "tester-attestation";
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=all&labels=${LABEL}&per_page=100`;

type GithubIssue = {
  number: number;
  title: string;
  html_url: string;
  body: string | null;
  state: "open" | "closed";
  created_at: string;
  labels: Array<{ name: string }>;
  pull_request?: unknown;
};

function matchLine(body: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const bulletMatch = body.match(new RegExp(`- ${escaped}:\\s*(.+)`, "i"));
  if (bulletMatch?.[1]) {
    return bulletMatch[1].trim();
  }

  const boldMatch = body.match(new RegExp(`\\*\\*${escaped}\\*\\*:?\\s*(.+)`, "i"));
  if (boldMatch?.[1]) {
    return boldMatch[1].trim();
  }

  const headingMatch = body.match(new RegExp(`###\\s*${escaped}\\s*\\n+([^#\\n][\\s\\S]*?)(?=\\n###|$)`, "i"));
  if (headingMatch?.[1]) {
    return headingMatch[1].trim().split(/\r?\n/)[0]?.trim();
  }

  return undefined;
}

function parseRole(body: string) {
  const role = matchLine(body, "Role")?.toLowerCase();
  if (role && ["judge", "creator", "publisher", "builder", "agent-operator", "other"].includes(role)) {
    if (role === "publisher") {
      return "creator";
    }
    return role;
  }

  return "other";
}

function parseBoolean(body: string, label: string) {
  const value = matchLine(body, label)?.toLowerCase();
  return value === "yes" || value === "true" || value === "checked";
}

function parseProofHash(body: string) {
  return matchLine(body, "Proof hash") ?? null;
}

export async function getGithubTractionSnapshot() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "kleos-traction-verifier",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        source: "github-issues",
        repository: `${REPO_OWNER}/${REPO_NAME}`,
        label: LABEL,
        reachable: false,
        error: `GitHub returned ${response.status}.`,
        issues: [],
        totals: emptyTotals(),
        successGates: gatesFromTotals(emptyTotals()),
      };
    }

    const data = (await response.json()) as GithubIssue[];
    const issues = data
      .filter((issue) => !issue.pull_request)
      .map((issue) => {
        const body = issue.body ?? "";
        return {
          number: issue.number,
          title: issue.title,
          url: issue.html_url,
          state: issue.state,
          role: parseRole(body),
          scenarioRun: parseBoolean(body, "Scenario run"),
          useful: parseBoolean(body, "Useful"),
          proofHash: parseProofHash(body),
          createdAt: issue.created_at,
        };
      });
    const totals = {
      githubIssueAttestations: issues.length,
      scenarioRunsAttested: issues.filter((issue) => issue.scenarioRun).length,
      usefulVotes: issues.filter((issue) => issue.useful).length,
      creatorOrPublisherAttestations: issues.filter((issue) => issue.role === "creator").length,
      builderOrOperatorAttestations: issues.filter((issue) =>
        ["builder", "agent-operator"].includes(issue.role),
      ).length,
      judgeAttestations: issues.filter((issue) => issue.role === "judge").length,
      proofHashes: new Set(issues.map((issue) => issue.proofHash).filter(Boolean)).size,
    };

    return {
      source: "github-issues",
      repository: `${REPO_OWNER}/${REPO_NAME}`,
      label: LABEL,
      reachable: true,
      issues,
      totals,
      successGates: gatesFromTotals(totals),
      issueCreationUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new?template=tester-attestation.md&labels=${LABEL}`,
    };
  } catch (error) {
    return {
      source: "github-issues",
      repository: `${REPO_OWNER}/${REPO_NAME}`,
      label: LABEL,
      reachable: false,
      error: error instanceof Error ? error.message : "GitHub traction check failed.",
      issues: [],
      totals: emptyTotals(),
      successGates: gatesFromTotals(emptyTotals()),
    };
  }
}

function emptyTotals() {
  return {
    githubIssueAttestations: 0,
    scenarioRunsAttested: 0,
    usefulVotes: 0,
    creatorOrPublisherAttestations: 0,
    builderOrOperatorAttestations: 0,
    judgeAttestations: 0,
    proofHashes: 0,
  };
}

function gatesFromTotals(totals: ReturnType<typeof emptyTotals>) {
  return {
    fivePublicAttestations: totals.githubIssueAttestations >= 5,
    threeScenarioRuns: totals.scenarioRunsAttested >= 3,
    creatorOrPublisher: totals.creatorOrPublisherAttestations >= 1,
    builderOrOperator: totals.builderOrOperatorAttestations >= 1,
    uniqueProofHashes: totals.proofHashes >= 3,
    allPassed:
      totals.githubIssueAttestations >= 5 &&
      totals.scenarioRunsAttested >= 3 &&
      totals.creatorOrPublisherAttestations >= 1 &&
      totals.builderOrOperatorAttestations >= 1 &&
      totals.proofHashes >= 3,
  };
}

export type GithubTractionSnapshot = Awaited<ReturnType<typeof getGithubTractionSnapshot>>;
