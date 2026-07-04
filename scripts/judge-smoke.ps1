param(
  [string]$BaseUrl = "http://127.0.0.1:3000"
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

Write-Step "Catalog"
$catalog = Invoke-RestMethod "$BaseUrl/api/catalog"
if (-not $catalog.items -or $catalog.items.Count -lt 1) {
  throw "Catalog returned no sources."
}
$first = $catalog.items[0].id
Write-Host "First source: $first"

Write-Step "Unpaid content must return 402"
try {
  Invoke-WebRequest "$BaseUrl/api/content/$first" -ErrorAction Stop | Out-Null
  throw "Unpaid content unexpectedly unlocked."
} catch {
  $response = $_.Exception.Response
  if (-not $response) {
    throw
  }
  $status = [int]$response.StatusCode
  if ($status -ne 402) {
    throw "Expected 402, received $status."
  }
  if (-not $response.Headers["PAYMENT-REQUIRED"]) {
    throw "Missing PAYMENT-REQUIRED header."
  }
  Write-Host "402 and PAYMENT-REQUIRED header confirmed."
}

Write-Step "Local payment proof unlocks content"
$paid = Invoke-RestMethod `
  -Uri "$BaseUrl/api/content/$first" `
  -Headers @{ "PAYMENT-SIGNATURE" = "kleos-payment-proof:$first:judge-smoke" }
Write-Host "Unlocked: $($paid.item.title)"

Write-Step "Creator source registration"
$registered = Invoke-RestMethod `
  -Uri "$BaseUrl/api/sources/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"title":"Judge smoke source","sourceUrl":"https://example.com/judge-smoke","preview":"A creator source registered by the judge smoke script.","priceUsdc":0.003,"creatorName":"Judge Smoke Creator"}'
Write-Host "Registered: $($registered.item.title)"

Write-Step "Budgeted buyer agent"
$run = Invoke-RestMethod `
  -Uri "$BaseUrl/api/agent/research" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"task":"Explain Kleos to judges with emphasis on citation receipts, x402, buyer budgets, dynamic pricing, and splits.","budgetUsdc":0.018}'
if ($run.session.spentUsdc -gt $run.session.budgetUsdc) {
  throw "Buyer agent exceeded budget."
}
Write-Host "Spent $($run.session.spentUsdc) of $($run.session.budgetUsdc) USDC."

Write-Step "Answer citation settlement"
$settlement = Invoke-RestMethod `
  -Uri "$BaseUrl/api/citations/finalize" `
  -Method Post `
  -ContentType "application/json" `
  -Body "{`"sessionId`":`"$($run.session.id)`",`"answer`":`"Kleos settles grounded AI answers by charging read tolls to inspect sources and citation tolls only for sources used in the final answer.`",`"maxCitationSpendUsdc`":0.006}"
if (-not $settlement.citationReceipts -or $settlement.citationReceipts.Count -lt 1) {
  throw "Citation finalization created no receipts."
}
if ($settlement.settlement.citationTollUsdc -gt 0.006) {
  throw "Citation settlement exceeded citation budget."
}
Write-Host "Citation tolls: $($settlement.settlement.citationTollUsdc) USDC."

Write-Step "Retroactive impact pool"
$impact = Invoke-RestMethod `
  -Uri "$BaseUrl/api/impact/settle" `
  -Method Post `
  -ContentType "application/json" `
  -Body "{`"settlementId`":`"$($settlement.settlement.id)`",`"sponsorPoolUsdc`":0.012}"
if (-not $impact.impactGrants -or $impact.impactGrants.Count -lt 1) {
  throw "Impact settlement created no grants."
}
Write-Host "Impact grants: $($impact.impactGrants.Count)"

Write-Step "Shareable answer proof"
$answerProof = Invoke-RestMethod "$BaseUrl/api/answers/proof?settlementId=$($settlement.settlement.id)"
if ($answerProof.status -ne "minted") {
  throw "Answer proof was not minted."
}
if (-not $answerProof.claimTraces -or $answerProof.claimTraces.Count -lt 1) {
  throw "Answer proof has no claim traces."
}
Write-Host "Proof hash: $($answerProof.proofHash)"
Write-Host "Claim traces: $($answerProof.claimTraces.Count)"

Write-Step "Receipt verification"
$receiptId = $settlement.citationReceipts[0].id
$verification = Invoke-RestMethod `
  -Uri "$BaseUrl/api/receipts/verify" `
  -Method Post `
  -ContentType "application/json" `
  -Body "{`"receiptId`":`"$receiptId`"}"
if ($verification.verification.status -eq "invalid") {
  throw "Receipt verification failed."
}
if (-not $verification.verification.proofHash) {
  throw "Receipt verification did not return a proof hash."
}
Write-Host "Verification: $($verification.verification.status)"
Write-Host "Verification proof: $($verification.verification.proofHash)"

Write-Step "Citation challenge broker"
$challenge = Invoke-RestMethod `
  -Uri "$BaseUrl/api/citations/challenge" `
  -Method Post `
  -ContentType "application/json" `
  -Body "{`"receiptId`":`"$receiptId`",`"challenger`":`"Judge Smoke Auditor`",`"challengeReason`":`"Stress-test citation support before submission.`",`"claimedWeakness`":`"weak_support_span`"}"
if (-not $challenge.challenge.proofHash) {
  throw "Citation challenge did not return a proof hash."
}
Write-Host "Challenge status: $($challenge.challenge.status)"
Write-Host "Challenge proof: $($challenge.challenge.proofHash)"

Write-Step "Signed creator webhooks"
$webhooks = Invoke-RestMethod `
  -Uri "$BaseUrl/api/webhooks/dispatch" `
  -Method Post `
  -ContentType "application/json" `
  -Body "{`"settlementId`":`"$($settlement.settlement.id)`",`"eventType`":`"citation.settled`"}"
if (-not $webhooks.deliveries -or $webhooks.deliveries.Count -lt 1) {
  throw "Webhook dispatch created no signed deliveries."
}
Write-Host "Webhook deliveries: $($webhooks.deliveries.Count)"

Write-Step "Creator cash-outs"
$cashouts = Invoke-RestMethod `
  -Uri "$BaseUrl/api/creators/cashout" `
  -Method Post
if (-not $cashouts.cashouts -or $cashouts.cashouts.Count -lt 1) {
  throw "Creator cash-out created no records."
}
Write-Host "Cash-outs: $($cashouts.cashouts.Count)"
Write-Host "Cash-out USDC: $($cashouts.totals.amountUsdc)"

Write-Step "Tester attestation"
$attestation = Invoke-RestMethod `
  -Uri "$BaseUrl/api/traction/attest" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"testerName":"Judge Smoke Tester","testerRole":"builder","scenarioRun":true,"useful":true,"quote":"Smoke test verified the Kleos proof flow end to end."}'
if (-not $attestation.attestation.proofHash) {
  throw "Tester attestation did not return a proof hash."
}
if (-not $attestation.attestation.githubIssueUrl) {
  throw "Tester attestation did not return a GitHub issue URL."
}
Write-Host "Attestation: $($attestation.attestation.proofHash)"

Write-Step "Citation-aware repricing"
$pricing = Invoke-RestMethod `
  -Uri "$BaseUrl/api/pricing/recompute" `
  -Method Post
Write-Host "Pricing events returned: $($pricing.events.Count)"

Write-Step "Ledger proof"
$ledger = Invoke-RestMethod "$BaseUrl/api/dashboard/ledger"
if ($ledger.metrics.citationReceipts -lt 1) {
  throw "No citation receipts were created."
}
if ($ledger.metrics.answerSettlements -lt 1) {
  throw "No answer settlements were created."
}
if ($ledger.metrics.agentTrustProofs -lt 1) {
  throw "No A2A proof events are present."
}
Write-Host "Citations: $($ledger.metrics.citationReceipts)"
Write-Host "Answer settlements: $($ledger.metrics.answerSettlements)"
Write-Host "Citation toll volume: $($ledger.metrics.citationTollUsdc)"
Write-Host "A2A proofs: $($ledger.metrics.agentTrustProofs)"
Write-Host "Impact grants: $($ledger.metrics.impactGrants)"
Write-Host "Registered sources: $($ledger.metrics.registeredSources)"
Write-Host "Claim traces: $($ledger.metrics.claimTraces)"
Write-Host "Webhook deliveries: $($ledger.metrics.webhookDeliveries)"
Write-Host "Creator cash-outs: $($ledger.metrics.creatorCashouts)"
Write-Host "Tester attestations: $($ledger.metrics.testerAttestations)"
Write-Host "Receipt verifications: $($ledger.metrics.receiptVerifications)"
Write-Host "Citation challenges: $($ledger.metrics.citationChallenges)"

Write-Step "Publisher kit"
$publisherKit = Invoke-RestMethod "$BaseUrl/api/publisher-kit"
if (-not $publisherKit.wellKnownManifest.catalog) {
  throw "Publisher kit is missing catalog URL."
}
Write-Host "Publisher manifest: $($publisherKit.wellKnownManifest.protocol)"

Write-Step "Submission report"
$report = Invoke-RestMethod "$BaseUrl/api/submission/report"
Write-Host "Project: $($report.project.name)"
Write-Host "Readiness: $($report.rubric.readiness.totalPct)%"

Write-Step "Proof pack"
$proofPack = Invoke-RestMethod "$BaseUrl/api/proof-pack"
if (-not $proofPack.strongestDifferentiators -or $proofPack.strongestDifferentiators.Count -lt 3) {
  throw "Proof pack is missing differentiators."
}
Write-Host "Proof pack differentiators: $($proofPack.strongestDifferentiators.Count)"

Write-Host ""
Write-Host "Judge smoke test passed." -ForegroundColor Green
