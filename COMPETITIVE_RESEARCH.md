# Kleos Competitive Research

## Executive Verdict

Kleos is no longer a generic paid-content dashboard. The core thesis is:

> AI agents should pay the sources that ground their answers, and every paid
> citation should settle to the collaborators behind that source.

This is the strongest available position because it combines:

- RFB 6 creator and publisher monetization.
- RFB 1 autonomous paying agents.
- RFB 3 agent identity, reputation, and trust loops.
- RFB 5 reusable x402/Gateway infrastructure.

The remaining submission gap is not code shape; it is live evidence. The
app now emits Circle-compatible x402 challenges and includes a seller-side
`BatchFacilitatorClient` verifier, but the submission still needs a deployed URL
plus real external paid traffic.

## Official Criteria Read

Lepton rewards projects that make AI agents economic actors. The official event
framing emphasizes agents that pay, receive, and orchestrate nanopayments on Arc,
with real settlement, stable USDC fees, and sub-second finality.

The official criteria emphasize:

- Agentic sophistication: 30%
- Traction: 30%
- Circle tool usage: 20%
- Innovation: 20%

The page also says reviewers review asynchronously. That means the repo and live app
must explain themselves without a narrated demo.

## Circle / Arc Technical Bar

Circle Nanopayments defines the technical pattern Kleos must satisfy:

1. Buyer deposits USDC into Gateway.
2. Buyer requests paid resource.
3. Seller returns `402 Payment Required`.
4. Buyer signs an EIP-3009 authorization offchain.
5. Buyer retries with `PAYMENT-SIGNATURE`.
6. Seller verifies and serves immediately.
7. Gateway batches authorizations and settles onchain.

The reference app uses a LangChain buyer agent, x402-protected Next.js seller
routes, Gateway batching, seller dashboard, and payment persistence. Kleos should
be reviewerd against that bar, not against a simple paywall.

## Final Competitor Read - July 4

### Keryx

This is the direct threat. Public repo and Discord claims show a live citation
toll reading agent with:

- Two-toll read/citation economics.
- MCP package and official registry presence.
- No-wallet trial and A2A endpoint.
- Source registry, creator cash-outs, signed webhooks, and public status page.
- Reported live numbers above 2,800 nanopayments and $14+ paid to 20 wallets,
  with the caveat that most volume is autonomous volume-engine traffic.

How Kleos must beat it:

- Do not pretend citation tolling alone is unique.
- Pitch Kleos as an operations and settlement layer: read toll -> citation toll
  -> collaborator split -> retroactive impact pool -> value-aware repricing.
- Make the async review path clearer than Keryx: one button, one proof pack, one
  publisher kit, one proof view.
- Emphasize that the seller agent changes future prices from answer impact, not
  only from access/citation counts.

Where Keryx still beats Kleos:

- Public live usage and deployment.
- MCP distribution.
- Creator cash-out and on-chain registry depth.

Final response:

- Deploy fast.
- Run a real deployed Circle CLI paid request.
- Collect 3-5 external tester runs.
- In the video, explicitly say: "Kleos is not claiming citation payment alone is
  new; Kleos proves the whole settlement operations loop around grounded AI
  answers."

### Tollgate

Strong competitor because it broadens creator payments across citations, photos,
and PeerTube-style media. Its multi-integration surface maps well to the
Distribution Bootstrap section of Lepton.

How Kleos beats it:

- More focused review path.
- Better agentic pricing loop.
- Stronger answer-linked receipt schema.
- Retroactive impact pool directly rewards what changed the final answer.

Where Tollgate beats Kleos:

- Broader distribution surface if integrations are real.
- Cross-project settlement claims.

### Argus

Strong on agency and traction: multi-agent consensus, Telegram, CLI, web, and
reported user counts. It is not creator monetization, but it may read as credible
if the usage claims verify.

How Kleos beats it:

- Better fit with creator/publisher tilt.
- More direct x402/Gateway creator payment story.

Where Argus beats Kleos:

- Real surfaces in front of users.
- Stronger public activity if their numbers verify.

### AgoraFX

Strong vertical project with reported markets, x402-paid signals, and a creator
article layer. It can win if reviewers value vertical traction over creator-payment
primitives.

How Kleos beats it:

- Cleaner reusable settlement primitive for any grounded answer.
- More direct match to RFB 6 and citation prior art.

Where AgoraFX beats Kleos:

- Claimed usage numbers and vertical specificity.

### CastPay / StreamArc

Strong distribution angle through existing media communities. Lepton's page
explicitly calls out Owncast, PeerTube, and media sidecars as good distribution
surfaces.

How Kleos beats them:

- Agent-native buying and citing decisions are more central.
- Kleos has a proof object for claims and source attribution, not only media
access.

Where they beat Kleos:

- Creator/media workflows may feel more real to non-technical reviewers.

## Older Competitor Read

### PayGate402

Strongest infrastructure competitor found. It claims:

- Drop-in `withPaywall()` wrapper.
- Real x402/Gateway flow.
- ERC-8004 identity and reputation.
- Dynamic pricing by reputation.
- Agent-to-agent jobs and escrow lifecycle.
- Dashboard and external payer flow.

How Kleos beats it:

- More specific creator/publisher thesis.
- Citation receipts tie payment to actual answer grounding.
- Collaborator splits are first-class rather than generic API seller revenue.

Where PayGate402 still beats Kleos:

- Live Gateway verification if their claims work.
- Stronger reusable developer primitive.
- More onchain identity/reputation evidence.

### Faregate

Very sharp minimal product: make AI crawlers pay per-read while humans read free.

How Kleos beats it:

- Richer buyer-agent budget decisions.
- Dynamic pricing.
- Source/citation receipts.
- Collaborator splits.

Where Faregate beats Kleos:

- Simpler 2-minute proof path.
- Stronger if it prints real Arc receipts today.

### Findling

Potentially the most dangerous RFB 6 competitor if the Discord claims are true:
agent-payable video clips, x402, Circle Gateway, Arc, split license payouts,
MCP, and a live skill file.

How Kleos beats it:

- Broader article/source/citation settlement layer.
- Stronger agent research workflow and dynamic pricing.

Where Findling beats Kleos:

- Creator marketplace is concrete.
- Human studio upload path and agent path sound production-like.
- Real license purchase receipts may read as stronger than local proof.

### Mahshar

Strong on Circle-stack breadth: API marketplace, endpoint scoring, x402,
Gateway, Circle Agent Wallet, Arc Memo, Bridge Kit, App Kit, and 100+ claimed
transactions.

How Kleos beats it:

- More aligned with creator/publisher monetization.
- More narrative clarity for why nanopayments matter.

Where Mahshar beats Kleos:

- Circle tool breadth.
- Claimed transaction volume.

### Lepton Duel

Real deployed Arc Testnet contract, Solidity tests, autonomous runner, staked
PvP, Elo leaderboard, and USDC pot. It is a serious build.

How Kleos beats it:

- Much stronger RFB/theme alignment.
- x402/Gateway-oriented product surface.
- Creator monetization and citation payment story.

Where Lepton Duel beats Kleos:

- Onchain completeness.
- Solidity test coverage.
- Live contract proof.

## Category Strategy

### Agentic Sophistication

Target: full marks.

Current:

- Buyer agent evaluates relevance, trust, price, budget, and reputation discount.
- Seller agent reprices by demand signals.
- Citation receipts show claim-level source usage.
- A2A proof ledger records signed/bound external trust event.

Next:

- Add real LLM reasoning only if it can be deterministic and bounded.
- Show budget efficiency per answer: cost, sources bought, sources skipped,
  citation count, confidence.

### Traction

Target: credible, not inflated.

Current:

- App tracks runs, paid accesses, citations, creators, registered sources, A2A
  proof, and USDC moved.

Next:

- Deploy.
- Get 3-5 external users/builders to register sources or run the buyer agent.
- Capture exact counts in README and submission form.
- Prefer real cross-team x402 traffic over local clicks.

### Circle Tool Usage

Target: close the gap.

Current:

- Funded Gateway wallet proof.
- Gateway approval/deposit tx links.
- x402 v2-style challenge.
- Base64 `PAYMENT-REQUIRED`.
- GatewayWalletBatched metadata.
- `@circle-fin/x402-batching` live verifier and settlement adapter.
- Arc explorer-shaped records.

Next:

- Run Circle CLI `services pay` against the deployed content endpoint.
- Add the real receipt to README, dashboard, and video.

### Innovation

Target: full marks.

Kleos is differentiated by the combination:

- Citation tolling.
- Budgeted buyer agents.
- Dynamic seller pricing.
- Creator source intake.
- Claim-level citation receipts.
- Collaborator split payouts.
- Agent-to-agent proof ledger.

The video must say this clearly: "Kleos is not a paywall. It is a settlement
layer for the sources AI agents use to produce answers."

## Final Build Priorities

1. Public deployment.
2. One real Circle CLI x402 paid request against the live URL.
3. External tester runs.
4. Video under 3 minutes.
5. README with exact proof links and traction counts.
