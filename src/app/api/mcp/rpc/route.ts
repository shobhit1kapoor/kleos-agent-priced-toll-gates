import { handleMcpRpc } from "@/lib/kleos/mcp-rpc";
import { publicOriginFromRequest } from "@/lib/kleos/request-origin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = publicOriginFromRequest(request);

  return Response.json(
    {
      name: "Kleos MCP JSON-RPC endpoint",
      endpoint: `${origin}/api/mcp/rpc`,
      methods: ["initialize", "tools/list", "tools/call", "resources/list", "resources/read"],
      example: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "quote_source",
          arguments: { itemId: "ci_arc_gateway_notes" },
        },
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Parameters<typeof handleMcpRpc>[0] | null;

  if (!body || typeof body !== "object") {
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Invalid JSON-RPC body." } },
      { status: 400 },
    );
  }

  return Response.json(await handleMcpRpc(body, publicOriginFromRequest(request)), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
