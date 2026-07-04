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
- `GET /api/content/:id` - Charon Gateway content endpoint. Returns `402
  Payment Required` unless a valid `PAYMENT-SIGNATURE` is supplied.
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
- `POST /api/citations/challenge` - lets an evaluator challenge weak citations
  and mark the broker bond at risk when support fails.
- `POST /api/impact/settle` - allocates a sponsor-backed impact pool only after
  citation receipts prove which sources changed the answer.
- `POST /api/webhooks/dispatch` - queues signed creator webhook payloads for
  citation, impact, and cash-out events.
- `POST /api/creators/cashout` - aggregates creator balances from read tolls,
  citation tolls, and impact grants into Arc-ready cash-out records.
- `POST /api/traction/attest` - mints a signed tester proof hash and prefilled
  GitHub issue URL after someone runs the public scenario.
- `GET /api/publisher-kit` - returns a `/.well-known/kleos.json` publisher
  manifest, crawler policy, and RSS/Ghost integration mapping.
- `GET /api/proof-pack` - bundles the judge proof trail: rubric, metrics,
  Gateway proof, receipts, impact grants, and open deployment items.
- `GET /api/submission/report` - judge-facing project summary, rubric mapping,
  current metrics, Gateway proof, and submission checklist.
- `POST /api/sources/register` - creator source intake that adds a priced source
  to the catalog with a default 100% creator split.

## Judging strategy

Kleos is designed around the hackathon scoring surface:

- **Agentic sophistication (30%):** buyer agents score sources by relevance,
  trust, current toll, reputation discount, and remaining budget, then decide
  which purchased sources deserve citation tolls; seller agents reprice from
  read demand, citation rate, confidence, and bought-but-not-cited signals; answer
  proofs expose claim-level covered, partial, and unsupported support traces;
  verifier and challenge agents audit receipts and release or risk the citation
  broker bond.
- **Traction (30%):** the app records buyer-agent runs, paid accesses, USDC
  moved, creators paid, source count, answer settlements, citation receipts,
  registered/RSS-imported sources, receipt verifications, citation challenges,
  A2A proof events, and payout splits. For final submission, use the live
  deployment with several external testers so the traction numbers are not only
  local.
- **Circle tool usage (20%):** the project uses the x402 request shape, Gateway
  funding proof, Arc explorer links, USDC-denominated tolls, and a split
  contract. Live Circle Gateway verification through `BatchFacilitatorClient` is
  implemented, with local proof mode retained for deterministic judge walkthroughs.
- **Innovation (20%):** Kleos combines two-stage creator citation tolls,
  answer-linked receipt hashes, claim-level proof traces, independent receipt
  verification, adversarial citation challenges, signed creator webhooks, creator
  cash-out aggregation, tester attestations, value-of-information pricing,
  autonomous buyer budgets, MCP discovery, publisher manifests, retroactive
  impact rewards, bonded broker proof, and collaborator royalties.

The dashboard includes a rubric scorecard so reviewers can see the judge case
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
- **Local judge walkthrough path:** `PAYMENT-SIGNATURE:
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

## Judge path

1. Open the app and inspect the rubric scorecard.
2. Register a creator source or inspect the existing catalog.
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
10. Inspect paid reads, bought-but-not-cited sources, answer-linked receipts,
   x402 settlement records, and collaborator split payouts.
11. Click **Reprice sources** to run the citation-aware seller pricing agent.
12. Open `/api/proof-pack` and `/api/submission/report` for the structured
   submission summary.

## Citation receipt schema

Each finalized answer emits receipts shaped for reuse by other builders:

- `answerHash`, `receiptHash`, `supportSpan`
- `readPaymentId`, `citationPaymentId`, `citationTollUsdc`
- `claim`, `confidence`, `settlementStatus`
- `itemId`, `sessionId`, collaborator payout split ids through the payment ledger

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

- `SUBMISSION_REPORT.md` - judge-facing project report.
- `COMPETITIVE_RESEARCH.md` - competitor teardown and full-mark strategy.
- `VIDEO_SCRIPT.md` - under-3-minute recording script.
- `FINAL_SUBMISSION_CHECKLIST.md` - final deploy/submission checklist.
