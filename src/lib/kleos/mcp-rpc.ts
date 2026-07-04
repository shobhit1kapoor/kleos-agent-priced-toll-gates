import { runA2AAsk } from "./a2a";
import { buildAnswerProof } from "./answer-proof";
import { createPaymentProof, settlePayment } from "./charon";
import { getEncryptedVaultItem, releaseVaultKey } from "./content-vault";
import { createCreatorCashouts, dispatchCreatorWebhooks } from "./creator-ops";
import { getGithubTractionSnapshot } from "./github-traction";
import { settleImpactPool } from "./impact-pool";
import { getLedgerSnapshot } from "./ledger";
import { buildPublicStatus, buildTreasuryProof } from "./public-ops";
import { verifyCitationReceipt } from "./receipt-verifier";
import { buildSourceRegistry } from "./source-registry";
import { getCatalogItems } from "./store";
import { buildTractionCampaign, createTesterAttestation } from "./traction";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toolResult(data: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data,
  };
}

export const mcpTools: ToolDefinition[] = [
  {
    name: "list_paid_sources",
    description: "List priced creator content exposed by Charon Gateway.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "quote_source",
    description: "Return current x402 read/citation tolls, source metadata, and collaborator splits.",
    inputSchema: {
      type: "object",
      required: ["itemId"],
      properties: { itemId: { type: "string" } },
    },
  },
  {
    name: "buy_source",
    description: "Settle a local-development source purchase and return split payout records.",
    inputSchema: {
      type: "object",
      required: ["itemId"],
      properties: {
        itemId: { type: "string" },
        sessionId: { type: "string" },
        paymentSignature: { type: "string" },
      },
    },
  },
  {
    name: "get_answer_proof",
    description: "Return answer proof with claim traces, citation receipts, creator payouts, and live x402 proof.",
    inputSchema: {
      type: "object",
      properties: { settlementId: { type: "string" } },
    },
  },
  {
    name: "list_source_registry",
    description: "Return creator-scoped source registry records and split digests.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_encrypted_vault_item",
    description: "Return public ciphertext and x402-gated key-release policy for a paid creator source.",
    inputSchema: {
      type: "object",
      required: ["itemId"],
      properties: { itemId: { type: "string" } },
    },
  },
  {
    name: "release_vault_key",
    description: "Release an encrypted content key after a valid local or x402 payment proof.",
    inputSchema: {
      type: "object",
      required: ["itemId", "paymentSignature"],
      properties: {
        itemId: { type: "string" },
        paymentSignature: { type: "string" },
      },
    },
  },
  {
    name: "ask_kleos_agent",
    description: "Pay Kleos over x402/local proof for an A2A grounded-answer run.",
    inputSchema: {
      type: "object",
      required: ["question", "paymentSignature"],
      properties: {
        question: { type: "string" },
        budgetUsdc: { type: "number" },
        paymentSignature: { type: "string" },
      },
    },
  },
  {
    name: "verify_citation_receipt",
    description: "Verify receipt links, read/citation payments, split totals, and claim support.",
    inputSchema: {
      type: "object",
      properties: { receiptId: { type: "string" } },
    },
  },
  {
    name: "settle_impact_pool",
    description: "Allocate sponsor capital retroactively to cited sources after answer settlement proves impact.",
    inputSchema: {
      type: "object",
      properties: {
        settlementId: { type: "string" },
        sponsorPoolUsdc: { type: "number" },
      },
    },
  },
  {
    name: "dispatch_creator_webhooks",
    description: "Queue signed creator webhook payloads for cited-source, impact, or cash-out events.",
    inputSchema: {
      type: "object",
      properties: {
        settlementId: { type: "string" },
        eventType: { type: "string" },
      },
    },
  },
  {
    name: "create_creator_cashouts",
    description: "Aggregate creator balances into Arc-ready cash-out records.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_tester_attestation",
    description: "Mint a signed tester proof hash and prefilled public GitHub issue URL.",
    inputSchema: {
      type: "object",
      properties: {
        testerName: { type: "string" },
        testerRole: { type: "string" },
        quote: { type: "string" },
      },
    },
  },
  {
    name: "get_traction_campaign",
    description: "Return tester asks, curl payloads, social copy, and 100/100 success gates.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "verify_github_traction",
    description: "Verify durable public tester attestations from GitHub issues.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_public_status",
    description: "Return public operations status and proof links.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_treasury_proof",
    description: "Return Gateway, toll, split, impact, and cash-out treasury proof.",
    inputSchema: { type: "object", properties: {} },
  },
];

export function mcpResources(origin: string) {
  return getCatalogItems().map((item) => ({
    uri: `kleos://content/${item.id}`,
    name: item.title,
    mimeType: "application/json",
    description: item.preview,
    endpoint: `${origin}/api/content/${item.id}`,
  }));
}

export function mcpDiscovery(origin: string) {
  return {
    name: "Kleos MCP Server",
    version: "0.3.0",
    protocolVersion: "2025-06-18",
    transport: "http-json-rpc",
    rpcEndpoint: `${origin}/api/mcp/rpc`,
    manifestEndpoint: `${origin}/api/mcp`,
    capabilities: {
      tools: true,
      resources: true,
      prompts: false,
    },
    tools: mcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    })),
    resources: mcpResources(origin),
  };
}

async function callTool(name: string, args: Record<string, unknown>, origin: string) {
  switch (name) {
    case "list_paid_sources":
      return toolResult(getCatalogItems());
    case "quote_source": {
      const itemId = asString(args.itemId);
      const item = getCatalogItems().find((entry) => entry.id === itemId);
      if (!item) {
        throw new Error(`Unknown source: ${itemId}`);
      }
      return toolResult(item);
    }
    case "buy_source": {
      const itemId = asString(args.itemId);
      const sessionId = asString(args.sessionId, "mcp_session");
      const paymentSignature =
        asString(args.paymentSignature) || createPaymentProof(itemId, "kleos://mcp-client");
      return toolResult(settlePayment({ itemId, sessionId, paymentSignature }));
    }
    case "get_answer_proof":
      return toolResult(buildAnswerProof(asString(args.settlementId) || undefined, origin));
    case "list_source_registry":
      return toolResult(buildSourceRegistry());
    case "get_encrypted_vault_item": {
      const item = getEncryptedVaultItem(asString(args.itemId), origin);
      if (!item) {
        throw new Error(`Unknown vault item: ${asString(args.itemId)}`);
      }
      return toolResult(item);
    }
    case "release_vault_key":
      return toolResult(
        releaseVaultKey({
          itemId: asString(args.itemId),
          paymentSignature: asString(args.paymentSignature),
        }),
      );
    case "ask_kleos_agent":
      return toolResult(
        await runA2AAsk({
          origin,
          paymentSignature: asString(args.paymentSignature),
          question: asString(args.question),
          budgetUsdc: asNumber(args.budgetUsdc),
        }),
      );
    case "verify_citation_receipt":
      return toolResult(verifyCitationReceipt(asString(args.receiptId) || undefined));
    case "settle_impact_pool":
      return toolResult(
        settleImpactPool({
          settlementId: asString(args.settlementId) || undefined,
          sponsorPoolUsdc: asNumber(args.sponsorPoolUsdc),
        }),
      );
    case "dispatch_creator_webhooks":
      return toolResult(
        dispatchCreatorWebhooks({
          settlementId: asString(args.settlementId) || undefined,
          eventType: asString(args.eventType) as Parameters<typeof dispatchCreatorWebhooks>[0]["eventType"],
        }),
      );
    case "create_creator_cashouts":
      return toolResult(createCreatorCashouts());
    case "create_tester_attestation":
      return toolResult(
        createTesterAttestation({
          testerName: asString(args.testerName) || undefined,
          testerRole: asString(args.testerRole) as Parameters<typeof createTesterAttestation>[0]["testerRole"],
          quote: asString(args.quote) || undefined,
          liveUrl: origin,
        }),
      );
    case "get_traction_campaign":
      return toolResult(buildTractionCampaign(origin));
    case "verify_github_traction":
      return toolResult(await getGithubTractionSnapshot());
    case "get_public_status":
      return toolResult(await buildPublicStatus());
    case "get_treasury_proof":
      return toolResult(buildTreasuryProof());
    default:
      throw new Error(`Unknown MCP tool: ${name}`);
  }
}

function success(id: JsonRpcRequest["id"], result: unknown) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    result,
  };
}

function failure(id: JsonRpcRequest["id"], code: number, message: string) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message },
  };
}

export async function handleMcpRpc(request: JsonRpcRequest, origin: string) {
  const method = request.method;
  const params = request.params ?? {};

  try {
    if (method === "initialize") {
      return success(request.id, {
        protocolVersion: "2025-06-18",
        serverInfo: { name: "kleos-mcp", version: "0.3.0" },
        capabilities: { tools: {}, resources: {} },
      });
    }

    if (method === "tools/list") {
      return success(request.id, { tools: mcpTools });
    }

    if (method === "resources/list") {
      return success(request.id, { resources: mcpResources(origin) });
    }

    if (method === "resources/read") {
      const uri = asString(params.uri);
      const itemId = uri.replace("kleos://content/", "");
      const item = getCatalogItems().find((entry) => entry.id === itemId);
      if (!item) {
        throw new Error(`Unknown resource: ${uri}`);
      }
      return success(request.id, {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              id: item.id,
              title: item.title,
              preview: item.preview,
              readTollUsdc: item.currentPriceUsdc,
              citationTollUsdc: item.citationPriceUsdc,
              collaborators: item.collaborators,
            }),
          },
        ],
      });
    }

    if (method === "tools/call") {
      const name = asString(params.name);
      const args =
        typeof params.arguments === "object" && params.arguments
          ? (params.arguments as Record<string, unknown>)
          : {};
      return success(request.id, await callTool(name, args, origin));
    }

    if (method === "ledger/snapshot") {
      return success(request.id, getLedgerSnapshot());
    }

    return failure(request.id, -32601, `Method not found: ${method ?? "missing"}`);
  } catch (error) {
    return failure(request.id, -32000, error instanceof Error ? error.message : "MCP call failed.");
  }
}
