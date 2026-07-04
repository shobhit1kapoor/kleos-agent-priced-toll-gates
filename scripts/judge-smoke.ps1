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

Write-Step "Traction campaign kit"
$campaign = Invoke-RestMethod "$BaseUrl/api/traction/campaign"
if (-not $campaign.roleSpecificAsks -or $campaign.roleSpecificAsks.Count -lt 3) {
  throw "Traction campaign is missing role-specific asks."
}
if (-not $campaign.discordCopy -or -not $campaign.xCopy) {
  throw "Traction campaign is missing outreach copy."
}
Write-Host "Remaining attestations: $($campaign.currentScorePath.remainingAttestations)"
Write-Host "Tester roles: $($campaign.roleSpecificAsks.Count)"

Write-Step "Durable GitHub traction verifier"
$githubTraction = Invoke-RestMethod "$BaseUrl/api/traction/github"
if ($null -eq $githubTraction.reachable) {
  throw "GitHub traction verifier did not return reachability status."
}
if (-not $githubTraction.successGates) {
  throw "GitHub traction verifier did not return success gates."
}
Write-Host "GitHub reachable: $($githubTraction.reachable)"
Write-Host "GitHub issue attestations: $($githubTraction.totals.githubIssueAttestations)"

Write-Step "Public operations status"
$publicStatus = Invoke-RestMethod "$BaseUrl/api/status"
if (-not $publicStatus.checks -or $publicStatus.checks.Count -lt 4) {
  throw "Public status endpoint is missing checks."
}
Write-Host "Ops status: $($publicStatus.status)"

Write-Step "Treasury proof"
$treasury = Invoke-RestMethod "$BaseUrl/api/treasury"
if (-not $treasury.gateway.liveX402Receipt.receiptId) {
  throw "Treasury proof is missing live x402 receipt."
}
Write-Host "Treasury read tolls: $($treasury.totals.readTollUsdc)"
Write-Host "Treasury citation tolls: $($treasury.totals.citationTollUsdc)"

Write-Step "OpenAPI manifest"
$openApi = Invoke-RestMethod "$BaseUrl/api/openapi"
if (-not $openApi.paths."/api/trial/sponsored") {
  throw "OpenAPI manifest is missing sponsored trial route."
}
Write-Host "OpenAPI: $($openApi.info.title)"

Write-Step "Agent card discovery"
$agentCard = Invoke-RestMethod "$BaseUrl/.well-known/agent-card.json"
if ($agentCard.name -ne "Kleos") {
  throw "Agent card name is not Kleos."
}
if (-not $agentCard.services.mcpRpc -or -not $agentCard.services.a2aAsk) {
  throw "Agent card is missing MCP or A2A service links."
}
if ($agentCard.erc8004Readiness.onchainRegistrationClaimed) {
  throw "Agent card should not claim ERC-8004 onchain registration."
}
Write-Host "Agent card wallet: $($agentCard.agentWallet)"

Write-Step "Source registry"
$registry = Invoke-RestMethod "$BaseUrl/api/registry/sources"
if (-not $registry.records -or $registry.records.Count -lt 1) {
  throw "Source registry returned no records."
}
if (-not $registry.contract.sourceFile) {
  throw "Source registry is missing contract artifact reference."
}
Write-Host "Registry records: $($registry.records.Count)"

Write-Step "Encrypted content vault"
$vault = Invoke-RestMethod "$BaseUrl/api/vault/$first"
if (-not $vault.encrypted.ciphertext -or -not $vault.keyRelease.endpoint) {
  throw "Vault is missing encrypted content or key release policy."
}
$keyRelease = Invoke-RestMethod `
  -Uri "$BaseUrl/api/vault/$first/key" `
  -Method Post `
  -Headers @{ "PAYMENT-SIGNATURE" = "kleos-payment-proof:$first:vault-smoke" }
if (-not $keyRelease.key -or -not $keyRelease.releaseProof) {
  throw "Vault key release did not return a key and proof."
}
Write-Host "Vault proof: $($keyRelease.releaseProof)"

Write-Step "Agent-to-agent paid ask"
try {
  Invoke-RestMethod `
    -Uri "$BaseUrl/api/a2a/ask" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"question":"How should agents pay creators for grounded answers?"}' | Out-Null
  throw "A2A ask unexpectedly ran without payment."
} catch {
  $response = $_.Exception.Response
  if (-not $response -or [int]$response.StatusCode -ne 402) {
    throw
  }
}
$a2a = Invoke-RestMethod `
  -Uri "$BaseUrl/api/a2a/ask" `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ "PAYMENT-SIGNATURE" = "kleos-payment-proof:a2a:judge-smoke" } `
  -Body '{"question":"How should agents pay creators for grounded answers?","budgetUsdc":0.018}'
if (-not $a2a.answerHash -or -not $a2a.citationReceipts -or $a2a.citationReceipts.Count -lt 1) {
  throw "A2A paid ask did not produce answer settlement proof."
}
Write-Host "A2A answer hash: $($a2a.answerHash)"

Write-Step "Sponsored no-wallet trial"
$trial = Invoke-RestMethod `
  -Uri "$BaseUrl/api/trial/sponsored" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"budgetUsdc":0.018,"citationBudgetUsdc":0.006,"sponsorPoolUsdc":0.012}'
if (-not $trial.citations.citationReceipts -or $trial.citations.citationReceipts.Count -lt 1) {
  throw "Sponsored trial created no citation receipts."
}
if (-not $trial.impact.impactGrants -or $trial.impact.impactGrants.Count -lt 1) {
  throw "Sponsored trial created no impact grants."
}
Write-Host "Trial mode: $($trial.trial.mode)"
Write-Host "Trial citations: $($trial.citations.citationReceipts.Count)"

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
