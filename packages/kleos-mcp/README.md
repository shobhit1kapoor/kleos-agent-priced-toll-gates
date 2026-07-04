# kleos-mcp

MCP stdio bridge for Kleos.

Kleos exposes a hosted JSON-RPC MCP endpoint at:

```text
https://kleos-agent-priced-toll-gates.vercel.app/api/mcp/rpc
```

This package lets MCP clients use that endpoint through a standard stdio process.
It is intentionally dependency-light and only requires Node.js 20.18.2 or newer.

## Usage

From this repository:

```bash
node packages/kleos-mcp/bin/kleos-mcp.js --list-tools
node packages/kleos-mcp/bin/kleos-mcp.js --call quote_source --arguments itemId=ci_arc_gateway_notes
```

As an MCP server command after publishing:

```bash
npx -y kleos-mcp
```

To point at a different Kleos deployment:

```bash
KLEOS_MCP_ENDPOINT=https://your-domain.example/api/mcp/rpc npx -y kleos-mcp
```

## Exposed Tools

The bridge forwards to the live Kleos MCP JSON-RPC endpoint, including:

- `list_paid_sources`
- `quote_source`
- `buy_source`
- `get_answer_proof`
- `list_source_registry`
- `import_rss_feed`
- `get_encrypted_vault_item`
- `release_vault_key`
- `ask_kleos_agent`
- `verify_citation_receipt`
- `settle_impact_pool`
- `dispatch_creator_webhooks`
- `create_creator_cashouts`
- `create_tester_attestation`
- `get_traction_campaign`
- `verify_github_traction`
- `get_public_status`
- `get_treasury_proof`

## Judge Note

Keryx has strong MCP distribution. This package is Kleos' reusable bridge for the
same agent-client channel, while Kleos adds answer-linked receipts, receipt
verification, citation challenges, impact rewards, creator webhooks, cash-outs,
source registry records, encrypted vaults, and score-honest public traction
gates.
