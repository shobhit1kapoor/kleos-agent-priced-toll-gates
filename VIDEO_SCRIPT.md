# Kleos 3-Minute Demo Script

Target length: 2:30-2:50.

## 0:00-0:20 - Problem

AI agents increasingly read, summarize, cite, and transform creator work. The
creator gets no payment when their work becomes the source of an answer. Kleos
turns that source boundary into a tiny x402 toll.

Line to say:

> Kleos is a citation settlement network: agents pay the sources they use, and
> each paid citation settles to the collaborators behind the work.

## 0:20-0:45 - Product Surface

Show the dashboard.

Point out:

- RFB 6 creator monetization.
- Buyer agent budget.
- Seller pricing agent.
- Gateway-funded Arc Testnet wallet.
- Rubric scorecard.

## 0:45-1:10 - Creator Registers A Source

Use the creator intake card.

Say:

> A creator can add a source, set a toll, and immediately expose it to agents
> through the catalog and MCP surface.

Click **Register**.

## 1:10-1:45 - Buyer Agent Pays Under Budget

Click **Run scenario** or click **Run agent**, then **Finalize citations**.

Narrate:

- The buyer agent compares relevance, credibility, current toll, reputation
  discount, and remaining budget.
- It buys sources that clear the value threshold.
- It skips overpriced or redundant sources.

Show paid versus skipped table.

## 1:45-2:10 - Citation Receipts And Splits

Show citation receipts.

Say:

> Not every paid source becomes a citation. The agent bought sources to inspect
> them, then paid a second citation toll only for the sources actually used in
> the final answer. Each receipt has an answer hash, support span, read payment,
> citation payment, confidence, amount, and hash.

Show collaborator payouts.

## 2:10-2:35 - x402 / Circle / Arc Proof

Show:

- `402 Payment Required`
- `PAYMENT-REQUIRED` header
- Gateway approval/deposit tx links
- x402 settlement ledger
- A2A proof event

Say:

> The endpoint emits Circle Gateway-compatible x402 requirements and supports
> live Gateway verification through the Circle batching SDK. Local proof mode is
> only for judge walkthrough without private keys.

## 2:35-2:55 - Close

Show rubric scorecard and metrics.

Final line:

> Kleos is not another paywall. It is the missing settlement layer between AI
> answers and the creators whose work gives those answers authority.
