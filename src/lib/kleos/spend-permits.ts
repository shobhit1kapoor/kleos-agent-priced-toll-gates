import { makeHash } from "./charon";
import { getStore } from "./store";
import type { AgentSpendPermit } from "./types";

const DEFAULT_ENDPOINTS = [
  "/api/catalog",
  "/api/content/:id",
  "/api/agent/research",
  "/api/citations/finalize",
  "/api/receipts/verify",
  "/api/a2a/ask",
];

const DEFAULT_TOOLS = [
  "list_paid_sources",
  "quote_source",
  "buy_source",
  "get_answer_proof",
  "verify_citation_receipt",
  "ask_kleos_agent",
];

function makeId() {
  return `permit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function cleanList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);

  return cleaned.length > 0 ? cleaned : fallback;
}

function statusFor(permit: AgentSpendPermit): AgentSpendPermit["status"] {
  if (permit.status === "revoked") {
    return "revoked";
  }
  if (new Date(permit.expiresAt).getTime() <= Date.now()) {
    return "expired";
  }
  if (permit.remainingUsdc <= 0) {
    return "exhausted";
  }
  return "active";
}

export function issueAgentSpendPermit(input: {
  agentName?: string;
  operatorContact?: string;
  purpose?: string;
  budgetUsdc?: number;
  maxTollUsdc?: number;
  expiresInMinutes?: number;
  allowedTools?: string[];
  allowedEndpoints?: string[];
}) {
  const store = getStore();
  const id = makeId();
  const budgetUsdc = Number(clampNumber(input.budgetUsdc, 0.025, 0.001, 0.5).toFixed(6));
  const maxTollUsdc = Number(
    Math.min(budgetUsdc, clampNumber(input.maxTollUsdc, 0.006, 0.000001, 0.05)).toFixed(6),
  );
  const expiresInMinutes = Math.round(clampNumber(input.expiresInMinutes, 45, 5, 1440));
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000).toISOString();
  const agentName = input.agentName?.trim().slice(0, 80) || "External research agent";
  const purpose =
    input.purpose?.trim().slice(0, 180) ||
    "Budgeted inspection, citation settlement, and receipt verification for grounded AI answers.";
  const allowedTools = cleanList(input.allowedTools, DEFAULT_TOOLS);
  const allowedEndpoints = cleanList(input.allowedEndpoints, DEFAULT_ENDPOINTS);
  const policyDigest = makeHash(
    JSON.stringify({
      agentName,
      purpose,
      budgetUsdc,
      maxTollUsdc,
      expiresAt,
      allowedTools,
      allowedEndpoints,
    }),
  );
  const permitHash = makeHash(`${id}:${policyDigest}:${issuedAt}`);

  const permit: AgentSpendPermit = {
    id,
    agentName,
    operatorContact: input.operatorContact?.trim().slice(0, 120) || undefined,
    purpose,
    budgetUsdc,
    maxTollUsdc,
    spentUsdc: 0,
    remainingUsdc: budgetUsdc,
    allowedTools,
    allowedEndpoints,
    status: "active",
    expiresAt,
    issuedAt,
    permitHash,
    policyDigest,
    bearerPreview: `${permitHash.slice(0, 12)}...${permitHash.slice(-8)}`,
  };

  store.agentSpendPermits.unshift(permit);

  return {
    permit,
    verification: verifyAgentSpendPermit(permit.id),
  };
}

export function listAgentSpendPermits() {
  const store = getStore();

  return store.agentSpendPermits.map((permit) => ({
    ...permit,
    status: statusFor(permit),
  }));
}

export function verifyAgentSpendPermit(permitId?: string) {
  const store = getStore();
  const permit = permitId
    ? store.agentSpendPermits.find((entry) => entry.id === permitId)
    : store.agentSpendPermits[0];

  if (!permit) {
    return {
      status: "missing" as const,
      checks: [
        {
          label: "Permit exists",
          status: "fail" as const,
          details: "No spend permit is available.",
        },
      ],
    };
  }

  const computedStatus = statusFor(permit);
  const policyDigest = makeHash(
    JSON.stringify({
      agentName: permit.agentName,
      purpose: permit.purpose,
      budgetUsdc: permit.budgetUsdc,
      maxTollUsdc: permit.maxTollUsdc,
      expiresAt: permit.expiresAt,
      allowedTools: permit.allowedTools,
      allowedEndpoints: permit.allowedEndpoints,
    }),
  );
  const budgetSafe = permit.remainingUsdc >= 0 && permit.spentUsdc <= permit.budgetUsdc;
  const tollSafe = permit.maxTollUsdc <= permit.budgetUsdc;
  const digestSafe = policyDigest === permit.policyDigest;

  return {
    status: computedStatus,
    permit,
    auditHash: makeHash(`${permit.id}:${permit.permitHash}:${computedStatus}:${permit.remainingUsdc}`),
    checks: [
      {
        label: "Budget cap",
        status: budgetSafe ? ("pass" as const) : ("fail" as const),
        details: `${permit.spentUsdc.toFixed(6)} spent of ${permit.budgetUsdc.toFixed(6)} USDC.`,
      },
      {
        label: "Per-toll cap",
        status: tollSafe ? ("pass" as const) : ("fail" as const),
        details: `Maximum single toll is ${permit.maxTollUsdc.toFixed(6)} USDC.`,
      },
      {
        label: "Policy digest",
        status: digestSafe ? ("pass" as const) : ("fail" as const),
        details: digestSafe ? "Policy digest matches permit fields." : "Policy digest does not match permit fields.",
      },
      {
        label: "Expiry",
        status: computedStatus === "expired" ? ("warn" as const) : ("pass" as const),
        details: `Permit expires at ${permit.expiresAt}.`,
      },
    ],
  };
}

export function spendPermitSummary() {
  const permits = listAgentSpendPermits();

  return {
    totalPermits: permits.length,
    activePermits: permits.filter((permit) => permit.status === "active").length,
    aggregateBudgetUsdc: Number(permits.reduce((sum, permit) => sum + permit.budgetUsdc, 0).toFixed(6)),
    aggregateRemainingUsdc: Number(permits.reduce((sum, permit) => sum + permit.remainingUsdc, 0).toFixed(6)),
    latestPermit: permits[0] ?? null,
  };
}
