# Kleos

Kleos is the settlement layer for grounded AI answers.

Buyer agents discover priced creator sources, pay a read toll to inspect them,
then pay a second citation toll only for the sources actually used in the final
answer. Each answer-linked receipt records the answer hash, support span, read
payment, citation payment, confidence, and collaborator split outcome.

## Why this exists

AI agents increasingly read, cite, and transform creator work, but creators do
not get paid when their work becomes the substrate of an answer. Kleos makes that
boundary economic: if an agent crosses from preview to full content, it pays a
tiny toll.

## Hackathon fit

- **RFB 6 - Creator & Publisher Monetization:** creators earn per paid access.
- **RFB 1 - Autonomous Paying Agents:** buyer agents compare relevance, price,
  budget, and source coverage.
- **RFB 3 - Agent-to-Agent Networks:** local buyer reputation affects pricing
  policy and is designed to map to ERC-8004.
- **Circle/Arc:** x402-style 402 challenges, Gateway nanopayment settlement
  shape, Arc explorer links, and a royalty split contract.

## Product surfaces

- `GET /api/catalog` - priced source catalog for agents.
- `GET /api/status` - public operations status for async reviewers, including
  health checks, proof links, and the honest public-traction gate.
- `GET /api/health` - small uptime-monitor health check.
- `GET /api/treasury` - Gateway, read toll, citation toll, split, impact, and
  creator cash-out treasury proof.
- `GET /api/openapi` - OpenAPI-style index of the public Kleos API surface.
- `GET /.well-known/agent-card.json` and `GET /api/agent-card` - public agent
  card with Kleos wallet, x402 schemes, service endpoints, proof links, and
  ERC-8004-ready identity posture.
- `GET /api/content/:id` - Charon Gateway content endpoint. Returns `402
  Payment Required` unless a valid `PAYMENT-SIGNATURE` is supplied.
- `GET /api/registry/sources` - creator-scoped source registry with IPFS-shaped
  metadata/content CIDs, split digests, and Arc contract artifact mapping.
- `GET /api/vault/:id` - encrypted content vault record with public AES-GCM
  ciphertext and post-payment key release policy.
- `POST /api/vault/:id/key` - releases the AES-GCM key only after a payment
  proof.
- `POST /api/a2a/ask` and `POST /api/agent/ask` - x402-priced agent-to-agent
  grounded answer endpoint.
- `GET|POST /api/agents/spend-permits` - issues and verifies budget-capped,
  tool-scoped, expiry-bound spend permits for external agents.
- `GET|POST /api/volume/engine` - summarizes or runs capped internal
  autonomous agent-volume batches that inspect sources, pay read tolls, finalize
  citation tolls, and allocate impact rewards. These runs are labeled separately
  from external tester traction.
- `GET /.well-known/mcp.json` - MCP discovery document for agent clients.
- `POST /api/mcp/rpc` - JSON-RPC MCP endpoint for `tools/list`,
  `tools/call`, `resources/list`, and `resources/read`.
- `packages/kleos-mcp` - publishable MCP stdio bridge for agent clients; after
  publishing, the intended command is `npx -y kleos-mcp`.
- `POST /api/trial/sponsored` - no-wallet sponsored trial that runs the full
  inspect, buy, cite, impact, and reprice loop under bounded spend caps.
- `POST /api/agent/research` - runs the buyer research agent with a task and
  budget.
- `POST /api/pricing/recompute` - runs the seller pricing agent.
- `GET /api/dashboard/ledger` - returns catalog, sessions, pricing events,
  payments, answer settlements, citation receipts, splits, and traction metrics.
- `GET /api/mcp` - MCP-style tool and resource manifest.
- `POST /api/citations/finalize` - settles citation tolls for cited paid sources.
- `GET /api/answers/proof` - returns the shareable proof package for a finalized
  answer, including claim-level support traces, receipts, payouts, webhooks, and
  live x402 proof.
- `POST /api/receipts/verify` - independently verifies citation receipt links,
  read/citation payments, split totals, and claim support.
- `GET /api/transparency/log` - returns the public settlement/audit transparency
  root and hashed entries for payments, citations, splits, impact, cash-outs,
  verifications, and challenges.
- `GET /api/transparency/proof/:id` - returns an inclusion proof for a specific
  transparency log entry.
- `POST /api/citations/challenge` - lets an evaluator challenge weak citations
  and mark the broker bond at risk when support fails.
- `POST /api/impact/settle` - allocates a sponsor-backed impact pool only after
  citation receipts prove which sources changed the answer.
- `GET /api/impact/graph` - returns the source-to-answer-to-creator value graph
  with proof hashes for nodes and edges.
- `POST /api/webhooks/dispatch` - queues signed creator webhook payloads for
  citation, impact, and cash-out events.
- `POST /api/creators/cashout` - aggregates creator balances from read tolls,
  citation tolls, and impact grants into Arc-ready cash-out records.
- `scripts/invariant-check.ps1` - verifies budget caps, split totals, receipt
  links, registry records, vault gates, A2A gates, and validation integrity.
- `scripts/tester-run.ps1` - one-command tester runner that checks the live app,
  runs the no-wallet settlement scenario, mints a proof hash, and prints the
  prefilled GitHub attestation issue URL.
- `GET /test` - public tester page that lets nontechnical testers run the hosted
  scenario and open the prefilled GitHub issue from a browser.
- `GET /traction` - public traction command center with live GitHub gate status,
  role-specific tester invite links, outreach copy, and reviewer proof links.
- `GET /proof` - public proof explorer that turns the x402 receipt, submission
  certificate, transparency root, impact graph, and traction gates into a
  reviewer-readable audit console.
- `GET /creators` - public creator earnings ledger for read toll splits,
  citation toll splits, impact grants, source split policy, wallets, and
  Arc-ready cash-out records.
- `POST /api/traction/attest` - mints a signed tester proof hash and prefilled
  GitHub issue URL after someone runs the public scenario.
- `GET /api/traction/campaign` - returns role-specific tester asks, curl
  payloads, social copy, and success gates for collecting external validation.
- `GET /api/traction/invite` - returns one role-specific tester invite packet
  with a prefilled `/test` URL, DM/social copy, API curl, and the exact GitHub
  traction roles still needed.
- `GET /api/traction/github` - verifies durable public tester-attestation issues
  from GitHub so traction survives serverless cold starts and redeploys.
- `.github/ISSUE_TEMPLATE/tester-attestation.md` - public tester issue template
  that makes external feedback parseable by `/api/traction/github`.
- `POST /api/tester/one-click` - hosted tester flow that runs the no-wallet
  settlement scenario, verifies a receipt, mints a proof hash, and returns the
  prefilled GitHub issue URL without requiring a repo clone.
- `GET /api/publisher-kit` - returns a `/.well-known/kleos.json` publisher
  manifest, crawler policy, and RSS/Ghost integration mapping.
- `GET /api/proof-pack` - bundles the proof trail: metrics,
  Gateway proof, receipts, impact grants, and remaining submission items.
- `GET /api/provenance` and `GET /api/submission/certificate` - machine-readable
  submission certificate binding the live deployment, public repo, CI status,
  Circle x402 receipt, verification summary, and public traction gates.
- `GET /api/submission/bundle` - portable reviewer evidence bundle with form
  fields, demo script, proof links, tester invites, validation gates, and a bundle
  hash.
- `GET /api/submission/report` - reviewer-facing project summary, technical mapping,
  current metrics, Gateway proof, and submission checklist.
- `POST /api/sources/register` - creator source intake that adds a priced source
  to the catalog with a default 100% creator split.
- `POST /api/sources/import-rss` - fetches an RSS/Atom feed and imports recent
  entries as x402-priced creator sources.
- `GET|POST /api/publishers/verify` - issues and verifies publisher ownership
  challenges so source owners can bind a domain/feed to a payout wallet.
- `GET|POST /api/reputation/passport` - exports ERC-8004-ready local
  reputation passports and appends signed local trust attestations.

## Product strategy

Kleos is designed around the hackathon scoring surface:

- **Autonomous agents:** buyer agents score sources by relevance,
  trust, current toll, reputation discount, and remaining budget, then decide
  which purchased sources deserve citation tolls; seller agents reprice from
  read demand, citation rate, confidence, and bought-but-not-cited signals; answer
  proofs expose claim-level covered, partial, and unsupported support traces;
  verifier and challenge agents audit receipts and release or risk the citation
  broker bond.
- **Public validation:** the app records buyer-agent runs, paid accesses, USDC
  moved, creators paid, source count, answer settlements, citation receipts,
  registered/RSS-imported sources, receipt verifications, citation challenges,
  A2A proof events, and payout splits. For final submission, use the live
  deployment with several external testers so the traction numbers are not only
  local.
- **Circle / Arc payment rails:** the project uses the x402 request shape, Gateway
  funding proof, Arc explorer links, USDC-denominated tolls, and a split
  contract. Live Circle Gateway verification through `BatchFacilitatorClient` is
  implemented, with local proof mode retained for deterministic reviewer walkthroughs.
- **Original settlement design:** Kleos combines two-stage creator citation tolls,
  answer-linked receipt hashes, claim-level proof traces, independent receipt
  verification, adversarial citation challenges, signed creator webhooks, creator
  cash-out aggregation, tester attestations, value-of-information pricing,
  autonomous buyer budgets, MCP discovery, publisher manifests, retroactive
  impact rewards, bonded broker proof, collaborator royalties, no-wallet
  sponsored trials, public status, treasury proof, OpenAPI discoverability,
  source registry records, encrypted content vaults, and x402-priced A2A
  research, callable JSON-RPC MCP tools, plus CI-checked economic invariants.

The dashboard includes a system evidence map so reviewers can see the product case
and the remaining full-mark moves without needing a guided live demo.

See `COMPETITIVE_RESEARCH.md` for the detailed competitor teardown and final
full-mark strategy.

## Curated source pack

The catalog wraps public sources that directly support the Kleos thesis, then
serves short Kleos-written memos about why each source matters:

- Circle Gateway Nanopayments docs
- Circle x402 concepts docs
- `circlefin/arc-nanopayments`
- Canteen Distribution Bootstrap article
- `the-canteen-dev/ARC-cli`
- ERC-8004
- RSSHub

The app does not copy long external documents into the repo; it stores source
URLs, previews, and original summaries for the submission.

## Payment verification

The app supports two payment paths:

- **Live Circle Gateway path:** real base64 x402 `PAYMENT-SIGNATURE` payloads
  are verified and settled through `@circle-fin/x402-batching` using
  `BatchFacilitatorClient`.
- **Local reviewer walkthrough path:** `PAYMENT-SIGNATURE:
  kleos-payment-proof:<item-id>:...` unlocks content without private keys and
  records Gateway-shaped read/citation payments and split events.

Unpaid content requests return `402 Payment Required` with a base64
`PAYMENT-REQUIRED` header following the Circle reference pattern:
`{ x402Version, resource, accepts }`.

The current build is anchored to a real Arc Testnet-funded agent wallet:

- Agent wallet: `0x3a074d1050340eea8022df3359bc517431303e58`
- Gateway balance: `0.5` testnet USDC
- Gateway approval transaction:
  `0x9392311878c7cb59f46786a83497afc8d12518563c8d3f00dd2dea5c31035d63`
- Gateway deposit transaction:
  `0x46340b714c1cd406db8dafede42f8c10de08b5532905e301bae1ea9d4e599f31`
- Live Circle CLI x402 paid request:
  - Amount: `0.004` testnet USDC
  - Scheme: `GatewayWalletBatched`
  - Payer: `0x44557bc24c1c475b7b251c3fa8efae7527d96bf7`
  - Gateway transfer id: `0b795e06-3f01-4eff-b4f2-7fa9240781b1`
  - Arc explorer:
    `https://testnet.arcscan.app/tx/0b795e06-3f01-4eff-b4f2-7fa9240781b1`

The live x402 adapter lives in `src/lib/kleos/gateway-x402.ts`; the content
route calls it from `src/app/api/content/[id]/route.ts`.

## Review path

1. Open the app and inspect the system evidence map.
2. Register a creator source, import an RSS/Atom feed, verify publisher
   ownership, or inspect the existing catalog.
3. Click **Run scenario** or **Run agent** to execute a budgeted buyer-agent run.
4. Click **Finalize citations** to settle citation tolls only for sources used
   in the final answer.
5. Click **Settle impact** to allocate sponsor rewards to cited sources that
   proved impact in the final answer.
6. Open `/api/answers/proof` to inspect covered, partial, and unsupported claims.
7. POST `/api/receipts/verify` and `/api/citations/challenge` to verify receipt
   integrity and stress-test the broker bond.
8. POST `/api/webhooks/dispatch` and `/api/creators/cashout` to show signed
   creator notifications and Arc-ready creator cash-outs.
9. Click **Attest** or POST `/api/traction/attest` to mint a tester proof hash.
10. Open `/api/traction/campaign` to copy role-specific tester links and
    public validation wording.
11. Open `/api/traction/github` to verify public tester issues once testers submit
    the generated GitHub feedback links.
12. Open `/api/status`, `/api/treasury`, `/api/openapi`, and
    `/api/registry/sources` to inspect the operational proof surface.
13. Open `/.well-known/agent-card.json` to inspect Kleos as a discoverable
    agent service with wallet, x402, MCP, A2A, and proof links.
14. Open `/api/vault/ci_arc_gateway_notes`, then POST
    `/api/vault/ci_arc_gateway_notes/key` with a local payment proof to see
    x402-gated encrypted content key release.
15. POST `/api/a2a/ask` to run paid agent-to-agent research.
16. POST `/api/trial/sponsored` to run the no-wallet trial path from a single
    endpoint.
17. Inspect paid reads, bought-but-not-cited sources, answer-linked receipts,
   x402 settlement records, and collaborator split payouts.
18. Click **Reprice sources** to run the citation-aware seller pricing agent.
19. Open `/proof` for the reviewer-readable proof explorer.
20. Open `/creators` for the creator earnings ledger.
21. POST `/api/sources/import-rss` to show live publisher feed onboarding.
22. POST `/api/publishers/verify` to show source-owner verification before a
    publisher wallet is treated as owner-verified.
23. Open `/api/reputation/passport` to show buyer, creator, publisher, and
    settlement-agent reputation evidence.
21. Open `/api/proof-pack` and `/api/submission/report` for the structured
   submission summary.
22. Open `/api/provenance` or `/api/submission/certificate` to verify the live
   deployment, repo, CI, x402 receipt, and public validation
   gate in one object.

## Citation receipt schema

Each finalized answer emits receipts shaped for reuse by other builders:

- `answerHash`, `receiptHash`, `supportSpan`
- `readPaymentId`, `citationPaymentId`, `citationTollUsdc`
- `claim`, `confidence`, `settlementStatus`
- `itemId`, `sessionId`, collaborator payout split ids through the payment ledger

## MCP Bridge

Kleos includes a packageable MCP stdio bridge for agent clients:

```bash
node packages/kleos-mcp/bin/kleos-mcp.js --list-tools
node packages/kleos-mcp/bin/kleos-mcp.js --call quote_source --arguments itemId=ci_arc_gateway_notes
```

By default it targets the public Kleos deployment. Set `KLEOS_MCP_ENDPOINT` or
pass `--endpoint` to point it at a local or forked deployment.

## Tester Runner

The fastest way for external testers to produce durable public traction evidence:

Browser path:

1. Open https://kleos-agent-priced-toll-gates.vercel.app/test
2. Run the tester flow.
3. Open the generated GitHub issue URL and submit it publicly.

Fastest invite links:

- Creator/publisher: https://kleos-agent-priced-toll-gates.vercel.app/api/traction/invite?role=creator
- Builder: https://kleos-agent-priced-toll-gates.vercel.app/api/traction/invite?role=builder
- Agent operator: https://kleos-agent-priced-toll-gates.vercel.app/api/traction/invite?role=agent-operator

Hosted, no clone:

```bash
curl -X POST https://kleos-agent-priced-toll-gates.vercel.app/api/tester/one-click \
  -H "Content-Type: application/json" \
  -d '{"testerName":"Your Name","testerRole":"builder","quote":"I ran the Kleos flow and inspected the proof trail."}'
```

Repo-based:

```powershell
corepack pnpm tester:run -TesterName "Your Name" -Role builder -OpenIssue
```

The script checks the live deployment, runs the no-wallet settlement scenario,
verifies proof surfaces, mints a proof hash, and opens the prefilled GitHub issue
URL. Generated issues count only after they are submitted
publicly and `/api/traction/github` verifies the public gates.

## Royalty splitter

`contracts/RoyaltySplitter.sol` exposes:

```solidity
function splitPayment(
  bytes32 paymentId,
  address token,
  uint256 totalAmount,
  address[] calldata recipients,
  uint16[] calldata splitBps
) external
```

It validates that splits sum to 10,000 basis points, transfers ERC-20 amounts
from the payer, and emits one `RoyaltySplit` event per collaborator.

## Source registry

`contracts/SourceRegistry.sol` exposes creator-scoped source records:

- `sourceId`, `creatorScopedId`, owner wallet
- metadata CID and encrypted content CID
- split digest derived from collaborator recipients and basis points
- `SourceRegistered` and `SourceDeactivated` events

The live API mirrors that schema at `/api/registry/sources` so reviewers can inspect
the registry shape before contract deployment.

## Local setup

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Test commands

```bash
pnpm lint
pnpm build
pnpm smoke
pnpm invariants
```

With Circle CLI installed, inspect the x402 requirements without spending:

```powershell
corepack pnpm x402:estimate
```

To make a real paid request, run `circle services pay` without `--estimate`
against a running Kleos content endpoint.

## Environment

Optional:

```bash
KLEOS_AGENT_WALLET=0xYourArcAgentWallet
KLEOS_SELLER_WALLET=0xYourArcSellerWallet
KLEOS_GATEWAY_BALANCE_USDC=0.5
KLEOS_GATEWAY_APPROVAL_TX=0xYourApprovalTx
KLEOS_GATEWAY_DEPOSIT_TX=0xYourDepositTx
```

When adding real Circle Gateway credentials, keep them server-side only. Do not
prefix secrets with `NEXT_PUBLIC_`.

## Submission assets

- `SUBMISSION_REPORT.md` - reviewer-facing project report.
- `COMPETITIVE_RESEARCH.md` - competitor teardown and full-mark strategy.
- `VIDEO_SCRIPT.md` - under-3-minute recording script.
- `FINAL_SUBMISSION_CHECKLIST.md` - final deploy/submission checklist.
