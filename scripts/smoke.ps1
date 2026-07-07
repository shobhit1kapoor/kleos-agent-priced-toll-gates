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
  -Headers @{ "PAYMENT-SIGNATURE" = "kleos-payment-proof:$first:smoke" }
Write-Host "Unlocked: $($paid.item.title)"

Write-Step "Creator source registration"
$registered = Invoke-RestMethod `
  -Uri "$BaseUrl/api/sources/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"title":"Smoke test source","sourceUrl":"https://example.com/smoke-test-source","preview":"A creator source registered by the smoke script.","priceUsdc":0.003,"creatorName":"Smoke Test Creator"}'
Write-Host "Registered: $($registered.item.title)"

Write-Step "RSS publisher import"
$rssImport = Invoke-RestMethod `
  -Uri "$BaseUrl/api/sources/import-rss" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"feedUrl":"https://example.com/kleos-smoke-feed.xml","priceUsdc":0.0039,"creatorName":"Smoke RSS Publisher","limit":1}'
if (-not $rssImport.imported -or $rssImport.imported.Count -lt 1) {
  throw "RSS import did not create a priced source."
}
Write-Host "RSS imported: $($rssImport.imported.Count) source(s) in $($rssImport.feed.mode) mode"

Write-Step "Publisher ownership verification"
$publisherChallenge = Invoke-RestMethod `
  -Uri "$BaseUrl/api/publishers/verify" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"creatorName":"Smoke RSS Publisher","wallet":"0x0000000000000000000000000000000000000001","publisherUrl":"https://example.com","feedUrl":"https://example.com/kleos-smoke-feed.xml"}'
$challenge = $publisherChallenge.record.challenge
$publisherVerifyBody = @{
  creatorName = "Smoke RSS Publisher"
  wallet = "0x0000000000000000000000000000000000000001"
  publisherUrl = "https://example.com"
  feedUrl = "https://example.com/kleos-smoke-feed.xml"
  method = "manual-proof"
  proofText = "Kleos ownership proof: $challenge"
} | ConvertTo-Json -Compress
$publisherVerification = Invoke-RestMethod `
  -Uri "$BaseUrl/api/publishers/verify" `
  -Method Post `
  -ContentType "application/json" `
  -Body $publisherVerifyBody
if (-not $publisherVerification.verified) {
  throw "Publisher ownership verification did not pass."
}
Write-Host "Publisher verified: $($publisherVerification.record.id)"

Write-Step "Reputation passport"
$reputationPassport = Invoke-RestMethod "$BaseUrl/api/reputation/passport"
if (-not $reputationPassport.erc8004Ready -or $reputationPassport.erc8004Ready.onchainRegistrationClaimed) {
  throw "Reputation passport is missing the ERC-8004 adapter status."
}
if ($reputationPassport.settlementAgent.score -lt 80) {
  throw "Reputation passport settlement-agent score is unexpectedly low."
}
$reputationAttestation = Invoke-RestMethod `
  -Uri "$BaseUrl/api/reputation/passport" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"subject":"0x0000000000000000000000000000000000000003","title":"Smoke reputation attestation","note":"Smoke test appended a local trust event.","amountUsdc":0}'
if (-not $reputationAttestation.event.digest) {
  throw "Reputation attestation did not return a digest."
}
Write-Host "Reputation score: $($reputationPassport.settlementAgent.score)"

Write-Step "Budgeted buyer agent"
$run = Invoke-RestMethod `
  -Uri "$BaseUrl/api/agent/research" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"task":"Explain Kleos with emphasis on citation receipts, x402, buyer budgets, dynamic pricing, and splits.","budgetUsdc":0.018}'
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
  -Body "{`"receiptId`":`"$receiptId`",`"challenger`":`"Smoke Auditor`",`"challengeReason`":`"Stress-test citation support before submission.`",`"claimedWeakness`":`"weak_support_span`"}"
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

Write-Step "Transparency log"
$transparencyLog = Invoke-RestMethod "$BaseUrl/api/transparency/log"
if (-not $transparencyLog.rootHash -or $transparencyLog.entryCount -lt 1) {
  throw "Transparency log did not return a root hash and entries."
}
$sameSnapshotProof = $transparencyLog.sampleProofs[0]
if (-not $sameSnapshotProof.verified -or $sameSnapshotProof.recomputedRoot -ne $transparencyLog.rootHash) {
  throw "Transparency sample proof did not verify against the log root."
}
$transparencyProof = Invoke-RestMethod "$BaseUrl/api/transparency/proof/$($sameSnapshotProof.entryId)"
if (-not $transparencyProof.verified) {
  throw "Transparency proof endpoint did not return a verified proof."
}
Write-Host "Transparency root: $($transparencyLog.rootHash)"
Write-Host "Transparency proof: $($sameSnapshotProof.entryId)"

Write-Step "Impact graph"
$impactGraph = Invoke-RestMethod "$BaseUrl/api/impact/graph"
if (-not $impactGraph.graphHash -or $impactGraph.summary.edges -lt 1) {
  throw "Impact graph did not return a graph hash and value-flow edges."
}
Write-Host "Impact graph: $($impactGraph.summary.nodes) nodes, $($impactGraph.summary.edges) edges"
Write-Host "Impact graph hash: $($impactGraph.graphHash)"

Write-Step "Tester attestation"
$attestation = Invoke-RestMethod `
  -Uri "$BaseUrl/api/traction/attest" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"testerName":"Smoke Tester","testerRole":"builder","scenarioRun":true,"useful":true,"quote":"Smoke test verified the Kleos proof flow end to end."}'
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
Write-Host "Remaining attestations: $($campaign.publicValidationPath.remainingAttestations)"
Write-Host "Tester roles: $($campaign.roleSpecificAsks.Count)"

Write-Step "Tester invite packet"
$invite = Invoke-RestMethod "$BaseUrl/api/traction/invite?role=creator&name=Smoke%20Creator"
if (-not $invite.inviteUrl -or $invite.inviteUrl -notlike "*role=creator*") {
  throw "Tester invite packet did not return a creator invite URL."
}
if (-not $invite.copyBlocks.shortDm -or -not $invite.githubTraction.successGates) {
  throw "Tester invite packet is missing outreach copy or traction gates."
}
if ((-not $invite.recommendedBatch -or $invite.recommendedBatch.Count -lt 1) -and -not $invite.githubTraction.successGates.allPassed) {
  throw "Tester invite packet is missing recommended tester batch."
}
Write-Host "Invite URL: $($invite.inviteUrl)"

Write-Step "Hosted one-click tester flow"
$testerPage = Invoke-WebRequest -UseBasicParsing "$BaseUrl/test"
if ($testerPage.Content -notlike "*Create a public Kleos proof hash*") {
  throw "Public tester page did not render expected content."
}
$oneClick = Invoke-RestMethod `
  -Uri "$BaseUrl/api/tester/one-click" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"testerName":"One Click Tester","testerRole":"builder","quote":"One-click tester flow verified the hosted traction path."}'
if (-not $oneClick.attestation.proofHash -or -not $oneClick.githubIssueUrl) {
  throw "One-click tester flow did not return a proof hash and GitHub issue URL."
}
if (-not $oneClick.trial.citationReceipts -or $oneClick.trial.citationReceipts.Count -lt 1) {
  throw "One-click tester flow did not create citation receipts."
}
Write-Host "One-click proof: $($oneClick.attestation.proofHash)"

Write-Step "Traction command center"
$tractionPage = Invoke-WebRequest -UseBasicParsing "$BaseUrl/traction"
if ($tractionPage.Content -notlike "*Public Traction Command Center*") {
  throw "Traction command center did not render expected content."
}
if ($tractionPage.Content -notlike "*Public traction gates*") {
  throw "Traction command center is missing gate content."
}
Write-Host "Traction command center rendered."

Write-Step "Proof explorer page"
$proofExplorer = Invoke-WebRequest -UseBasicParsing "$BaseUrl/proof"
if ($proofExplorer.Content -notlike "*Kleos Proof Explorer*") {
  throw "Proof explorer did not render expected content."
}
if ($proofExplorer.Content -notlike "*Transparency root*") {
  throw "Proof explorer is missing transparency root content."
}
Write-Host "Proof explorer rendered."

Write-Step "Creator earnings page"
$creatorPage = Invoke-WebRequest -UseBasicParsing "$BaseUrl/creators"
if ($creatorPage.Content -notlike "*Creator Earnings Ledger*") {
  throw "Creator earnings page did not render expected content."
}
if ($creatorPage.Content -notlike "*Read toll splits*") {
  throw "Creator earnings page is missing read toll split content."
}
Write-Host "Creator earnings rendered."

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
if (-not $openApi.paths."/api/sources/import-rss") {
  throw "OpenAPI manifest is missing RSS import route."
}
if (-not $openApi.paths."/api/publishers/verify") {
  throw "OpenAPI manifest is missing publisher verification route."
}
if (-not $openApi.paths."/api/reputation/passport") {
  throw "OpenAPI manifest is missing reputation passport route."
}
if (-not $openApi.paths."/api/volume/engine") {
  throw "OpenAPI manifest is missing volume engine route."
}
if (-not $openApi.paths."/traction") {
  throw "OpenAPI manifest is missing traction command center route."
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
  -Headers @{ "PAYMENT-SIGNATURE" = "kleos-payment-proof:a2a:smoke" } `
  -Body '{"question":"How should agents pay creators for grounded answers?","budgetUsdc":0.018}'
if (-not $a2a.answerHash -or -not $a2a.citationReceipts -or $a2a.citationReceipts.Count -lt 1) {
  throw "A2A paid ask did not produce answer settlement proof."
}
Write-Host "A2A answer hash: $($a2a.answerHash)"

Write-Step "Agent spend permits"
$permit = Invoke-RestMethod `
  -Uri "$BaseUrl/api/agents/spend-permits" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"agentName":"Smoke external agent","budgetUsdc":0.025,"maxTollUsdc":0.006,"purpose":"Smoke-test bounded external agent spend."}'
if (-not $permit.permit.permitHash -or $permit.verification.status -ne "active") {
  throw "Spend permit was not issued as active."
}
if (($permit.verification.checks | Where-Object { $_.status -eq "fail" }).Count -gt 0) {
  throw "Spend permit verification returned a failing check."
}
$permitList = Invoke-RestMethod "$BaseUrl/api/agents/spend-permits?permitId=$($permit.permit.id)"
if ($permitList.verification.auditHash -notlike "0x*") {
  throw "Spend permit verification did not return an audit hash."
}
Write-Host "Spend permit: $($permit.permit.bearerPreview)"

Write-Step "Autonomous volume engine"
$volumeRun = Invoke-RestMethod `
  -Uri "$BaseUrl/api/volume/engine" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"targetRuns":3,"taskPrefix":"Smoke autonomous volume"}'
if ($volumeRun.run.completedRuns -lt 3 -or -not $volumeRun.run.proofHash) {
  throw "Volume engine did not complete the requested autonomous runs."
}
if ($volumeRun.summary.honesty -notlike "*do not count as external tester traction*") {
  throw "Volume engine summary is missing the traction honesty label."
}
Write-Host "Volume engine runs: $($volumeRun.run.completedRuns)"
Write-Host "Volume proof: $($volumeRun.run.proofHash)"

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
Write-Host "Evidence checks: $($report.evidenceMap.readiness.totalPct)%"

Write-Step "Submission bundle"
$bundle = Invoke-RestMethod "$BaseUrl/api/submission/bundle"
if ($bundle.bundleHash -notlike "0x*" -or -not $bundle.formFields.liveUrl) {
  throw "Submission bundle is missing hash or form fields."
}
if (-not $bundle.demoScriptUnder3Min -or $bundle.demoScriptUnder3Min.Count -lt 4) {
  throw "Submission bundle is missing demo script beats."
}
if (-not $bundle.testerRecruitment.creatorInvite.inviteUrl) {
  throw "Submission bundle is missing tester invite links."
}
Write-Host "Bundle hash: $($bundle.bundleHash)"

Write-Step "Proof pack"
$proofPack = Invoke-RestMethod "$BaseUrl/api/proof-pack"
if (-not $proofPack.strongestDifferentiators -or $proofPack.strongestDifferentiators.Count -lt 3) {
  throw "Proof pack is missing differentiators."
}
if ($proofPack.volumeEngine.honesty -notlike "*do not count as external tester traction*") {
  throw "Proof pack is missing the volume engine honesty label."
}
Write-Host "Proof pack differentiators: $($proofPack.strongestDifferentiators.Count)"

Write-Host ""
Write-Host "Kleos smoke test passed." -ForegroundColor Green
