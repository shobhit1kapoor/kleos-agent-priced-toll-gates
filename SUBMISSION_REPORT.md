# Kleos Submission Report

## Verdict

Kleos is a prize-competitive hackathon idea because it sits directly on the strongest
Lepton prompt: creator and publisher monetization. It is not another generic
payment dashboard. It gives AI agents a reason to spend, gives creators a reason
to onboard, and turns grounded AI answers into settlement events that prove which
creator work was inspected, cited, paid, and split.

The current build is strong enough to submit as a polished prototype and now has
the category-defining primitive: answer-linked citation settlement. It also has a
stable public deployment and a real Circle CLI x402 paid request against the
public content endpoint. The remaining gap that matters most is real
tester/creator usage before the deadline.

If that traction gap is closed with public tester-attestation issues, Kleos
becomes a strong top-submission contender.

## Hackathon Fit

Primary lane:

- RFB 6 - Creator & Publisher Monetization

Supporting lanes:

- RFB 1 - Autonomous Paying Agents
- RFB 3 - Agent-to-Agent Nanopayment Networks
- RFB 5 - Nanopayment Infrastructure & Tooling

Why this is the right idea:

- The hackathon leans toward creators and publishers.
- Kleos prices one content access at a time instead of forcing subscriptions.
- The buyer is an AI agent, not a human checkout flow.
- The seller side is agentic through dynamic pricing.
- Revenue splits are a first-class settlement output, not a spreadsheet after
  the fact.

## Current Product

Implemented:

- Charon Gateway endpoint that returns `402 Payment Required` for unpaid content.
- x402-style payment challenge with price, network, destination, Gateway, and
  accepted header.
- Base64 `PAYMENT-REQUIRED` header with GatewayWalletBatched metadata.
- Budgeted buyer research agent.
- Citation-aware seller pricing agent.
- Creator source registration.
- Two-stage read tolls and citation tolls.
- Answer finalization that cites only a subset of purchased sources.
- Citation receipts with answer hash, support span, read payment, citation
  payment, confidence, and split outcomes.
- Shareable answer proof endpoint with covered, partial, and unsupported
  claim-level support traces.
- Independent receipt verifier that checks answer links, read/citation payments,
  split totals, receipt hashes, and claim support.
- Public transparency log that rolls payments, citation receipts, collaborator
  splits, impact grants, cash-outs, verifications, and challenges into a root
  hash with per-entry inclusion proofs.
- Impact graph endpoint that traces source -> read toll -> citation receipt ->
  claim -> split/impact/cash-out records as a value-flow graph.
- Adversarial citation challenge route that releases or risks the broker bond
  depending on receipt and support quality.
- Signed creator webhook records for citation, impact, and cash-out events.
- Creator cash-out ledger that aggregates read tolls, citation tolls, and impact
  grants into Arc-ready settlement records.
- Tester attestation endpoint and dashboard action that mint a proof hash plus
  prefilled GitHub issue URL for external feedback.
- One-command tester runner that checks the live deployment, runs the no-wallet
  settlement scenario, mints a proof hash, and prints/opens the GitHub issue URL.
- Hosted `/api/tester/one-click` endpoint that does the same flow without a repo
  clone and returns the prefilled public GitHub issue URL.
- Public `/test` tester page that makes the same proof-hash and GitHub-issue
  flow usable from a browser.
- Public `/traction` command center that shows live GitHub traction gates,
  role-specific tester invite links, outreach copy, and judge proof links in one
  reviewer-readable page.
- Public `/proof` proof explorer that presents the live x402 receipt, submission
  certificate, transparency root, impact graph, proof links, and honest traction
  gates in one reviewer-readable page.
- Public `/creators` creator earnings ledger showing read toll splits, citation
  toll splits, impact rewards, source split policies, wallets, and Arc-ready
  cash-out records for each creator.
- Live RSS/Atom importer that lets a creator or publisher paste a feed URL and
  register recent entries as x402-priced sources.
- Publisher ownership verifier that binds a publisher domain/feed challenge to a
  creator payout wallet before sources are marked owner-verified.
- ERC-8004-ready reputation passport that turns paid reads, citation receipts,
  verified publishers, and challenge outcomes into portable trust evidence.
- Traction campaign endpoint with role-specific tester asks, curl payloads,
  Discord/X copy, and exact success gates for closing the external usage gap.
- Tester invite endpoint that emits a role-specific `/test` URL, short DM,
  Discord/X copy, API curl, and the remaining GitHub traction roles needed.
- GitHub traction verifier that counts public `tester-attestation` issues as
  durable external proof across redeploys and serverless cold starts.
- Public GitHub tester-attestation issue template so external testers can submit
  parseable traction evidence without custom instructions.
- Public operations status, health, treasury, and OpenAPI endpoints so async
  judges can verify liveness and scope without clicking through the UI.
- Portable submission evidence bundle with form fields, proof links, demo
  script, tester invites, score gates, and bundle hash for async judging.
- Well-known agent card exposing Kleos wallet, x402 payment schemes, MCP/A2A
  endpoints, proof links, and ERC-8004-ready identity posture.
- Creator-scoped source registry with IPFS-shaped metadata/content CIDs, split
  digests, and a deployable `contracts/SourceRegistry.sol` artifact.
- Encrypted content vault with public AES-GCM ciphertext and x402-gated key
  release.
- x402-priced A2A endpoint where external agents can buy a grounded answer from
  Kleos, after which Kleos pays creator sources and returns settlement proof.
- Agent spend permits that issue budget-capped, tool-scoped, expiry-bound
  policies for external agents before they buy, cite, or verify sources.
- Callable JSON-RPC MCP endpoint and `/.well-known/mcp.json` discovery document
  so agent clients can list resources, quote sources, and call Kleos tools.
- Publishable `packages/kleos-mcp` stdio bridge so agent clients can connect to
  Kleos with an `npx`-style MCP command after package publication.
- Economic invariant checker and GitHub Actions workflow for budget caps, split
  totals, receipt links, registry records, vault gates, A2A gates, and score
  honesty.
- Sponsored no-wallet trial endpoint that runs inspect, read toll settlement,
  citation settlement, impact allocation, and repricing from a bounded sponsor
  budget.
- A2A trust-event ledger with signed/bound proof plus a bonded citation broker.
- Live `@circle-fin/x402-batching` seller-side verifier for real Gateway x402
  payment payloads.
- Priced source catalog for agents.
- MCP-style catalog manifest.
- Dashboard ledger for payments, answer settlements, pricing events, decisions,
  citation receipts, and payouts.
- RoyaltySplitter smart contract.
- Arc Testnet Gateway funding proof:
  - Agent wallet: `0x3a074d1050340eea8022df3359bc517431303e58`
  - Gateway balance: `0.5` testnet USDC
  - Approval tx:
    `0x9392311878c7cb59f46786a83497afc8d12518563c8d3f00dd2dea5c31035d63`
  - Deposit tx:
    `0x46340b714c1cd406db8dafede42f8c10de08b5532905e301bae1ea9d4e599f31`
  - Live Circle CLI x402 paid request:
    - Amount: `0.004` testnet USDC
    - Scheme: `GatewayWalletBatched`
    - Payer: `0x44557bc24c1c475b7b251c3fa8efae7527d96bf7`
    - Gateway transfer id: `0b795e06-3f01-4eff-b4f2-7fa9240781b1`
    - Arc explorer:
      `https://testnet.arcscan.app/tx/0b795e06-3f01-4eff-b4f2-7fa9240781b1`

## Rubric Mapping

### Agentic Sophistication - 30%

Current strength: high.

Kleos has three active agent loops:

- Buyer agent: ranks sources by task relevance, source trust, toll price,
  remaining budget, and buyer reputation discount, then separately finalizes
  which purchased sources deserve citation tolls.
- Seller agent: adjusts prices within bounds based on paid reads, skipped reads,
  402 challenge demand, citation rate, citation confidence, and purchased-but-
  uncited signals.
- Evidence loop: finalized answers become citation receipts tied to answer
  hashes, support spans, read payments, citation payments, and split payouts.
- Proof loop: finalized answers expose claim-level support traces so judges can
  see which claims are covered, partial, or unsupported.
- Verifier loop: audit agents can independently verify receipts and challenge
  weak citations, causing bond and reputation consequences when support fails.

Full-mark move:

- Add more run history from external testers and show read-to-citation conversion
  plus cost per completed research task.

### Traction - 30%

Current strength: medium until testers.

The product measures the right traction metrics:

- Buyer-agent runs
- Paid source reads
- Answer settlements
- Citation receipts
- Citation toll volume
- Testnet USDC moved
- Average toll
- Creators onboarded
- Creators paid through split records
- Creator-registered and RSS-imported sources
- Signed creator webhook deliveries
- Creator cash-out records
- Receipt verification records
- Citation challenge outcomes
- Tester attestations
- Traction campaign success gates
- Durable GitHub issue attestations
- Public ops status checks
- Sponsored trial completions through `/api/trial/sponsored`
- Source registry and encrypted vault access
- A2A paid research requests
- CI/economic invariant pass status
- Agent-to-agent proof events
- Catalog size

Full-mark move:

- Ask 3-5 people to run the buyer agent, create public tester-attestation issues,
  record their feedback, and include exact counts in the submission form.

### Circle Tool Usage - 20%

Current strength: strong implementation surface with a real live receipt.

Implemented today:

- Arc Testnet funded wallet proof.
- Gateway approval and deposit transactions.
- x402-shaped 402 challenge flow with base64 `PAYMENT-REQUIRED`.
- `BatchFacilitatorClient` live verification and settlement adapter.
- USDC-denominated read and citation tolls.
- Royalty split contract.
- Gateway-shaped read/citation settlement ledger.

Full-mark move:

- Show the existing stable-deployment `circle services pay` receipt and Arcscan
  link in the demo.

### Innovation - 20%

Current strength: high.

Kleos is differentiated because the price is set by a seller agent, the buyer is
an autonomous budgeted agent, only cited purchased sources receive a second
payment, every payment fans out to collaborators, each final answer becomes a
shareable proof object, and creator operations continue through signed webhooks
and cash-out records. The verifier and challenge layer makes the proof object
adversarial: a weak citation can be challenged and can put the broker bond at
risk. The tester attestation flow converts external review into verifiable proof
hashes and public GitHub feedback links.
Competitors may build x402 endpoints or agent wallets; Kleos connects them into a
creator economy workflow judges can understand.

Full-mark move:

- In the video, show the price changing after citation signals. That makes the
  project feel alive rather than static.

## Submission Demo Script

Target length: under 3 minutes.

1. Problem: AI agents consume creator work, but creators do not get paid when
   agents read, cite, or transform it.
2. Product: Kleos turns grounded answers into settlement events: agents pay to
   inspect sources, pay again only when they cite them, and every toll splits to
   collaborators.
3. Show the catalog: priced sources, previews, splits, and toll ranges.
4. Run the buyer agent with a fixed budget.
5. Show paid versus skipped decisions, then finalize citations.
6. Show read tolls, citation tolls, answer-linked receipt hashes, x402 settlement
   records, and split payouts.
7. Open the answer proof, verify a receipt, and challenge one citation to show
   the bond/reputation audit path.
8. Open the creator operations endpoints.
9. Open public status, treasury, OpenAPI, and source registry endpoints.
10. Open encrypted vault ciphertext and release the key after payment proof.
11. Trigger the A2A paid research endpoint.
12. Trigger the sponsored no-wallet trial endpoint.
13. Open the traction campaign endpoint and show the tester success gates.
14. Open the GitHub traction verifier to show durable public feedback evidence.
15. Open `/proof` to show the proof explorer: x402 receipt, transparency root,
   impact graph, and score-honesty gate.
16. Open `/creators` to show creator earnings, split policies, wallets, and
   cash-out records.
17. Trigger repricing and show seller-agent price movement.
18. End with metrics: testnet USDC moved, paid accesses, buyer-agent runs,
   creators onboarded, and public tester-attestation progress.

## Final Checklist

- Public GitHub repo.
- Live deployment.
- `corepack pnpm lint` passes.
- `corepack pnpm build` passes.
- `corepack pnpm smoke` passes.
- `corepack pnpm invariants` passes.
- `/api/catalog` works.
- `/api/status`, `/api/health`, `/api/treasury`, and `/api/openapi` expose the
  public operations surface.
- `/.well-known/agent-card.json` and `/api/agent-card` expose the public Kleos
  agent service card.
- `/api/registry/sources`, `/api/vault/:id`, `/api/vault/:id/key`, and
  `/api/a2a/ask` expose registry, encrypted vault, and A2A proof.
- `/api/content/:id` returns 402 without payment.
- `/api/trial/sponsored` runs the no-wallet inspect/cite/reward/reprice loop.
- `/api/agent/research` runs and respects budget.
- `/api/citations/finalize` creates answer-linked citation tolls.
- `/api/receipts/verify` verifies receipt integrity.
- `/api/transparency/log` and `/api/transparency/proof/:id` expose the public
  settlement/audit root and inclusion proofs.
- `/api/impact/graph` exposes the source-to-answer-to-creator value graph.
- `/api/citations/challenge` records citation challenge outcomes.
- `/api/traction/campaign` returns tester asks and success gates.
- `/api/traction/invite` returns role-specific tester invite links and copy.
- `/api/traction/github` verifies public tester issue evidence.
- `/api/tester/one-click` lets external testers create a proof hash and GitHub
  issue URL from the hosted deployment.
- `/test` exposes the same flow as a browser-first tester page.
- `/proof` exposes the reviewer-readable proof explorer.
- `/creators` exposes the creator earnings ledger.
- `/api/sources/import-rss` imports recent RSS/Atom entries into the priced
  source catalog.
- `/api/publishers/verify` issues and verifies publisher ownership challenges.
- `/api/reputation/passport` exposes local reputation passports and trust
  attestations.
- `/api/agents/spend-permits` issues and verifies external-agent spend permits.
- `scripts/tester-run.ps1` gives external testers a one-command path to produce
  a proof hash and public GitHub issue URL.
- `/api/dashboard/ledger` shows payments, answer settlements, receipts, and splits.
- `/api/provenance` and `/api/submission/certificate` bind deployment, repo, CI,
  live x402 proof, score honesty, and public traction gates into one verifier.
- `/api/submission/bundle` returns the portable judge packet and tester invite
  packet in one hashed object.
- `/api/submission/report` returns the judge-facing summary.
- Video demo under 3 minutes.
- Submission form includes exact user/creator/payment counts.

## Best Next Moves

1. Send `/api/traction/invite?role=creator`, `/api/traction/invite?role=builder`,
   and `/api/traction/invite?role=agent-operator` links to 3-5 real testers,
   then ask them to submit the generated GitHub tester-attestation issue.
2. Add final traction numbers to the README and submission form.
3. Record the video only after the public tester-attestation count is visible.
