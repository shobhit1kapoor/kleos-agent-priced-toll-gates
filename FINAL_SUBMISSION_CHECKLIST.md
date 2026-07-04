# Final Submission Checklist

## Before Deployment

- `corepack pnpm lint`
- `corepack pnpm build`
- `corepack pnpm dev`
- `corepack pnpm smoke`
- `corepack pnpm x402:estimate`

Optional local real payment, spends testnet USDC:

```powershell
circle services pay http://127.0.0.1:3000/api/content/ci_arc_gateway_notes `
  --address 0x3a074d1050340eea8022df3359bc517431303e58 `
  --chain ARC-TESTNET `
  --max-amount 0.05 `
  --output json
```

## Live x402 Verification

The seller-side live verifier is implemented in:

- `src/lib/kleos/gateway-x402.ts`
- `src/app/api/content/[id]/route.ts`

The route accepts:

- local walkthrough proof: `PAYMENT-SIGNATURE: kleos-payment-proof:<item>:...`
- real x402 payload: base64 `PAYMENT-SIGNATURE` verified and settled through
  `BatchFacilitatorClient`

Use Circle CLI against the running app:

```powershell
circle services pay http://127.0.0.1:3000/api/content/ci_arc_gateway_notes `
  --address 0x3a074d1050340eea8022df3359bc517431303e58 `
  --chain ARC-TESTNET `
  --max-amount 0.05 `
  --estimate `
  --output json
```

To perform a real paid request, remove `--estimate`. Do that only when the
wallet has Gateway balance and you are ready to create real testnet activity.

## Deployment

Stable public deployment is complete.

Verified production URL:

- `https://kleos-agent-priced-toll-gates.vercel.app`

Verified live Circle CLI paid request:

- Amount: `0.004` testnet USDC
- Gateway transfer id: `0b795e06-3f01-4eff-b4f2-7fa9240781b1`
- Arc explorer:
  `https://testnet.arcscan.app/tx/0b795e06-3f01-4eff-b4f2-7fa9240781b1`

Before final submission:

1. Run the live URL through `scripts/judge-smoke.ps1 -BaseUrl <live-url>`.
2. Verify `/api/answers/proof`, `/api/webhooks/dispatch`, and
   `/api/creators/cashout` after one scenario.
3. Ask 3-5 testers to run the public scenario and click **Attest**.
4. Record final traction counts.
5. Record the under-3-minute demo.

## Traction

Before final form submission, collect:

- Number of external testers.
- Number of creator sources registered.
- Number of buyer-agent runs.
- Number of paid accesses.
- Number of answer settlements.
- Number of citation receipts.
- Number of claim traces.
- Number of signed creator webhook deliveries.
- Number of creator cash-outs.
- Number of tester attestations.
- Read-to-citation conversion rate.
- Total citation toll volume.
- Total testnet USDC moved.
- At least one concrete tester quote or issue found.

## Submission Form

Required:

- Public GitHub repo.
- Short video under 3 minutes.

Strongly encouraged:

- Live deployed URL.
- Real Arc/Gateway tx links.
- Concise traction numbers.

## Video

Use `VIDEO_SCRIPT.md`.

Keep the recording under 3 minutes. Show the product working; do not spend the
video explaining architecture diagrams.
