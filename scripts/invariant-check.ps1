param(
  [string]$BaseUrl = "http://127.0.0.1:3000"
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Assert-True($Condition, $Message) {
  if (-not $Condition) {
    throw $Message
  }
}

function Round-Usdc($Value) {
  return [math]::Round([double]$Value, 6)
}

Write-Step "Ledger economic invariants"
$ledger = Invoke-RestMethod "$BaseUrl/api/dashboard/ledger"

foreach ($session in $ledger.sessions) {
  Assert-True ($session.spentUsdc -le ($session.budgetUsdc + 0.000001)) "Session $($session.id) exceeded budget."
}
Write-Host "Budget caps checked: $($ledger.sessions.Count) session(s)."

foreach ($item in $ledger.catalog) {
  $splitTotal = ($item.collaborators | Measure-Object -Property splitBps -Sum).Sum
  Assert-True ($splitTotal -eq 10000) "Catalog item $($item.id) split total was $splitTotal, expected 10000."
}
Write-Host "Catalog split totals checked: $($ledger.catalog.Count) source(s)."

foreach ($payment in $ledger.payments) {
  $splits = @($ledger.payoutSplits | Where-Object { $_.paymentId -eq $payment.id })
  Assert-True ($splits.Count -gt 0) "Payment $($payment.id) has no collaborator splits."
  $splitAmount = Round-Usdc (($splits | Measure-Object -Property amountUsdc -Sum).Sum)
  $paymentAmount = Round-Usdc $payment.amountUsdc
  Assert-True ([math]::Abs($splitAmount - $paymentAmount) -le 0.000002) "Payment $($payment.id) splits total $splitAmount but payment amount is $paymentAmount."
}
Write-Host "Payment split totals checked: $($ledger.payments.Count) payment(s)."

foreach ($receipt in $ledger.citationReceipts) {
  $read = $ledger.payments | Where-Object { $_.id -eq $receipt.readPaymentId } | Select-Object -First 1
  $citation = $ledger.payments | Where-Object { $_.id -eq $receipt.citationPaymentId } | Select-Object -First 1
  Assert-True ($null -ne $read) "Receipt $($receipt.id) missing read payment $($receipt.readPaymentId)."
  Assert-True ($null -ne $citation) "Receipt $($receipt.id) missing citation payment $($receipt.citationPaymentId)."
  Assert-True ($citation.kind -eq "citation") "Receipt $($receipt.id) citation payment is not kind=citation."
  Assert-True ([math]::Abs((Round-Usdc $receipt.citationTollUsdc) - (Round-Usdc $citation.amountUsdc)) -le 0.000002) "Receipt $($receipt.id) citation toll does not match payment."
}
Write-Host "Citation receipt links checked: $($ledger.citationReceipts.Count) receipt(s)."

Write-Step "Registry and vault invariants"
$registry = Invoke-RestMethod "$BaseUrl/api/registry/sources"
Assert-True ($registry.records.Count -ge $ledger.catalog.Count) "Registry has fewer records than catalog."

foreach ($record in $registry.records) {
  $splitTotal = ($record.splitBps | Measure-Object -Property splitBps -Sum).Sum
  Assert-True ($splitTotal -eq 10000) "Registry record $($record.itemId) split total was $splitTotal, expected 10000."
  Assert-True ($record.metadataCid -like "ipfs://*") "Registry record $($record.itemId) metadata CID is not IPFS-shaped."
  Assert-True ($record.encryptedContentCid -like "ipfs://*") "Registry record $($record.itemId) encrypted content CID is not IPFS-shaped."
}
Write-Host "Registry records checked: $($registry.records.Count)."

$first = $ledger.catalog[0].id
$vault = Invoke-RestMethod "$BaseUrl/api/vault/$first"
Assert-True ($vault.encrypted.algorithm -eq "AES-256-GCM") "Vault algorithm is not AES-256-GCM."
Assert-True ($vault.encrypted.ciphertext.Length -gt 20) "Vault ciphertext is too short."

try {
  Invoke-RestMethod -Uri "$BaseUrl/api/vault/$first/key" -Method Post | Out-Null
  throw "Vault key release unexpectedly succeeded without payment."
} catch {
  $response = $_.Exception.Response
  Assert-True ($response -and [int]$response.StatusCode -eq 402) "Vault key release without payment did not return 402."
}
Write-Host "Vault payment gate checked."

Write-Step "Agent card invariants"
$agentCard = Invoke-RestMethod "$BaseUrl/.well-known/agent-card.json"
$agentCardAlias = Invoke-RestMethod "$BaseUrl/api/agent-card"
Assert-True ($agentCard.name -eq "Kleos") "Agent card name is not Kleos."
Assert-True ($agentCard.agentWallet -eq $ledger.gatewayProof.agentWallet) "Agent card wallet does not match ledger gateway proof."
Assert-True ($agentCard.services.mcpRpc -like "*/api/mcp/rpc") "Agent card is missing MCP RPC service."
Assert-True ($agentCard.services.a2aAsk -like "*/api/a2a/ask") "Agent card is missing A2A service."
Assert-True ($agentCard.services.provenance -like "*/api/provenance") "Agent card is missing provenance service."
Assert-True ($agentCard.services.oneClickTester -like "*/api/tester/one-click") "Agent card is missing one-click tester service."
Assert-True ($agentCard.erc8004Readiness.status -eq "adapter-ready") "Agent card ERC-8004 readiness is not adapter-ready."
Assert-True (-not $agentCard.erc8004Readiness.onchainRegistrationClaimed) "Agent card falsely claims ERC-8004 onchain registration."
Assert-True ($agentCardAlias.agentWallet -eq $agentCard.agentWallet) "Agent card API alias does not match well-known card."
Write-Host "Agent card checked: $($agentCard.agentWallet)."

Write-Step "A2A and score honesty invariants"
try {
  Invoke-RestMethod `
    -Uri "$BaseUrl/api/a2a/ask" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"question":"Invariant check unpaid A2A."}' | Out-Null
  throw "A2A ask unexpectedly succeeded without payment."
} catch {
  $response = $_.Exception.Response
  Assert-True ($response -and [int]$response.StatusCode -eq 402) "A2A ask without payment did not return 402."
}
Write-Host "A2A payment gate checked."

$positioning = Invoke-RestMethod "$BaseUrl/api/competitive/positioning"
$githubTraction = Invoke-RestMethod "$BaseUrl/api/traction/github"
if (-not $githubTraction.successGates.allPassed) {
  Assert-True ($positioning.rubricScoreEstimate.total -lt 100) "Score reached 100 without public GitHub traction gates."
}
Assert-True (-not $githubTraction.successGates.uniqueProofHashes) "Unique proof hashes gate should be false with zero public attestations."
Assert-True ($githubTraction.issueCreationUrl -like "*template=tester-attestation.md*") "GitHub traction verifier is not pointing to the tester issue template."
Write-Host "Score honesty checked: $($positioning.rubricScoreEstimate.total)/100."

Write-Step "Proof surface invariants"
$proofPack = Invoke-RestMethod "$BaseUrl/api/proof-pack"
Assert-True ($proofPack.strongestDifferentiators.Count -ge 16) "Proof pack is missing differentiators."
Assert-True ($proofPack.apiSurfaces -contains "POST /api/a2a/ask") "Proof pack missing A2A surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /test") "Proof pack missing public tester page surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /api/registry/sources") "Proof pack missing registry surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /api/vault/:id") "Proof pack missing vault surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /.well-known/agent-card.json") "Proof pack missing agent card well-known surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /api/agent-card") "Proof pack missing agent card API surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /api/provenance") "Proof pack missing provenance surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /api/submission/certificate") "Proof pack missing submission certificate surface."
Assert-True ($proofPack.apiSurfaces -contains "POST /api/tester/one-click") "Proof pack missing one-click tester surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /proof") "Proof pack missing public proof explorer surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /creators") "Proof pack missing public creator earnings surface."
Assert-True ($proofPack.apiSurfaces -contains "POST /api/sources/import-rss") "Proof pack missing RSS import surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /api/publishers/verify") "Proof pack missing publisher verification list surface."
Assert-True ($proofPack.apiSurfaces -contains "POST /api/publishers/verify") "Proof pack missing publisher verification surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /api/transparency/log") "Proof pack missing transparency log surface."
Assert-True ($proofPack.transparencyLog.rootHash -like "0x*") "Proof pack missing transparency log root."
Assert-True ($proofPack.transparencyLog.totals.publisher_verification -ge 1) "Proof pack transparency log is missing publisher verification leaves."
Assert-True ($proofPack.apiSurfaces -contains "GET /api/impact/graph") "Proof pack missing impact graph surface."
Assert-True ($proofPack.impactGraph.graphHash -like "0x*") "Proof pack missing impact graph hash."
Write-Host "Proof pack surfaces checked."

Write-Step "Submission certificate invariants"
$certificate = Invoke-RestMethod "$BaseUrl/api/provenance"
Assert-True ($certificate.project.name -eq "Kleos") "Submission certificate project name is wrong."
Assert-True ($certificate.circleArcProof.liveX402Receipt.receiptId -eq $ledger.gatewayProof.liveX402Receipt.receiptId) "Submission certificate live x402 receipt does not match ledger."
Assert-True ($certificate.judgeProofLinks.submissionCertificate -like "*/api/submission/certificate") "Submission certificate is missing judge alias link."
Assert-True ($certificate.checks.Count -ge 8) "Submission certificate has too few checks."
if (-not $githubTraction.successGates.allPassed) {
  Assert-True ($certificate.rubricScoreEstimate.total -lt 100) "Submission certificate reached 100 without public GitHub traction gates."
  Assert-True ($certificate.remaining100PointGate -like "*5 public tester-attestation*") "Submission certificate does not explain the remaining public traction gate."
}
Write-Host "Submission certificate checked: $($certificate.status), $($certificate.rubricScoreEstimate.total)/100."

Write-Step "MCP RPC invariants"
$mcpDiscovery = Invoke-RestMethod "$BaseUrl/.well-known/mcp.json"
Assert-True ($mcpDiscovery.rpcEndpoint -like "*/api/mcp/rpc") "MCP discovery is missing RPC endpoint."
$toolsList = Invoke-RestMethod `
  -Uri "$BaseUrl/api/mcp/rpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
Assert-True ($toolsList.result.tools.Count -ge 10) "MCP tools/list returned too few tools."
$rssTools = @($toolsList.result.tools | Where-Object { $_.name -eq "import_rss_feed" })
Assert-True ($rssTools.Count -eq 1) "MCP tools/list is missing import_rss_feed."
$publisherTools = @($toolsList.result.tools | Where-Object { $_.name -eq "verify_publisher_ownership" })
Assert-True ($publisherTools.Count -eq 1) "MCP tools/list is missing verify_publisher_ownership."
$quote = Invoke-RestMethod `
  -Uri "$BaseUrl/api/mcp/rpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"quote_source","arguments":{"itemId":"ci_arc_gateway_notes"}}}'
Assert-True ($quote.result.structuredContent.id -eq "ci_arc_gateway_notes") "MCP quote_source did not return the requested source."
$mcpTransparency = Invoke-RestMethod `
  -Uri "$BaseUrl/api/mcp/rpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_transparency_log","arguments":{}}}'
Assert-True ($mcpTransparency.result.structuredContent.rootHash -like "0x*") "MCP transparency log did not return a root hash."
$mcpImpactGraph = Invoke-RestMethod `
  -Uri "$BaseUrl/api/mcp/rpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"get_impact_graph","arguments":{}}}'
Assert-True ($mcpImpactGraph.result.structuredContent.graphHash -like "0x*") "MCP impact graph did not return a graph hash."
$mcpTester = Invoke-RestMethod `
  -Uri "$BaseUrl/api/mcp/rpc" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"run_one_click_tester_flow","arguments":{"testerName":"MCP Tester","testerRole":"builder","quote":"MCP one-click tester flow verified."}}}'
Assert-True ($mcpTester.result.structuredContent.githubIssueUrl -like "*github.com/shobhit1kapoor/kleos-agent-priced-toll-gates/issues/new*") "MCP one-click tester flow did not return a GitHub issue URL."
$bridgeOutput = node packages/kleos-mcp/bin/kleos-mcp.js --endpoint "$BaseUrl/api/mcp/rpc" --list-tools
$bridge = $bridgeOutput | ConvertFrom-Json
Assert-True ($bridge.result.tools.Count -ge 10) "kleos-mcp bridge returned too few tools."
$bridgeQuoteTools = @($bridge.result.tools | Where-Object { $_.name -eq "quote_source" })
Assert-True ($bridgeQuoteTools.Count -eq 1) "kleos-mcp bridge missing quote_source."
Write-Host "MCP RPC and stdio bridge checked."

Write-Step "Traction template invariants"
$campaign = Invoke-RestMethod "$BaseUrl/api/traction/campaign"
Assert-True ($campaign.links.githubIssueTemplate -like "*template=tester-attestation.md*") "Traction campaign is missing the GitHub issue template link."
Assert-True ($campaign.links.testerPage -like "*/test") "Traction campaign is missing the public tester page."
Assert-True ($campaign.links.oneClickTester -like "*/api/tester/one-click") "Traction campaign is missing the one-click tester endpoint."
Assert-True (($campaign.successGates -join " ") -like "*5 public GitHub issues*") "Traction campaign does not describe the five-public-issue gate."
Assert-True ($campaign.testerRunner.command -like "*scripts/tester-run.ps1*") "Traction campaign is missing the tester runner command."
Write-Host "Traction template checked."

Write-Step "Tester runner invariants"
$runnerScript = Join-Path $PSScriptRoot "tester-run.ps1"
$runnerOutput = & $runnerScript `
  -BaseUrl $BaseUrl `
  -TesterName "Invariant Tester" `
  -Role "builder" `
  -Quote "Invariant check verified the one-command tester runner."
$runnerText = $runnerOutput -join " "
Assert-True ($runnerText -like "*KLEOS_PROOF_HASH=0x*") "Tester runner did not print a machine-readable proof hash."
Assert-True ($runnerText -like "*KLEOS_GITHUB_ISSUE_URL=https://github.com/shobhit1kapoor/kleos-agent-priced-toll-gates/issues/new*") "Tester runner did not print a machine-readable GitHub issue URL."
Write-Host "Tester runner checked."

Write-Step "Hosted tester flow invariants"
$testerPage = Invoke-WebRequest -UseBasicParsing "$BaseUrl/test"
Assert-True ($testerPage.Content -like "*Create a public Kleos proof hash*") "Public tester page did not render expected copy."
$proofExplorer = Invoke-WebRequest -UseBasicParsing "$BaseUrl/proof"
Assert-True ($proofExplorer.Content -like "*Kleos Proof Explorer*") "Proof explorer did not render expected copy."
Assert-True ($proofExplorer.Content -like "*Transparency root*") "Proof explorer is missing transparency evidence."
$creatorPage = Invoke-WebRequest -UseBasicParsing "$BaseUrl/creators"
Assert-True ($creatorPage.Content -like "*Creator Earnings Ledger*") "Creator earnings page did not render expected copy."
Assert-True ($creatorPage.Content -like "*Read toll splits*") "Creator earnings page is missing split evidence."
$transparencyLog = Invoke-RestMethod "$BaseUrl/api/transparency/log"
Assert-True ($transparencyLog.rootHash -like "0x*") "Transparency log did not return a root hash."
Assert-True ($transparencyLog.entryCount -ge $ledger.payments.Count) "Transparency log entry count is too low."
$sameSnapshotProof = $transparencyLog.sampleProofs[0]
Assert-True ($sameSnapshotProof.verified) "Transparency sample inclusion proof did not verify."
Assert-True ($sameSnapshotProof.recomputedRoot -eq $transparencyLog.rootHash) "Transparency sample inclusion proof root mismatch."
$transparencyProof = Invoke-RestMethod "$BaseUrl/api/transparency/proof/$($sameSnapshotProof.entryId)"
Assert-True ($transparencyProof.verified) "Transparency inclusion proof did not verify."
$impactGraph = Invoke-RestMethod "$BaseUrl/api/impact/graph"
Assert-True ($impactGraph.graphHash -like "0x*") "Impact graph did not return a graph hash."
Assert-True ($impactGraph.summary.edges -ge $ledger.citationReceipts.Count) "Impact graph has too few value-flow edges."
Assert-True (($impactGraph.nodes | Where-Object { $_.type -eq "creator" }).Count -ge 1) "Impact graph is missing creator nodes."
$oneClick = Invoke-RestMethod `
  -Uri "$BaseUrl/api/tester/one-click" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"testerName":"Hosted Invariant Tester","testerRole":"builder","quote":"Hosted one-click tester flow verified."}'
Assert-True ($oneClick.attestation.proofHash -like "0x*") "Hosted one-click tester flow did not return a proof hash."
Assert-True ($oneClick.githubIssueUrl -like "*github.com/shobhit1kapoor/kleos-agent-priced-toll-gates/issues/new*") "Hosted one-click tester flow did not return a GitHub issue URL."
Assert-True ($oneClick.trial.citationReceipts.Count -ge 1) "Hosted one-click tester flow created no citation receipts."
Write-Host "Hosted tester flow checked."

Write-Host ""
Write-Host "Kleos invariant check passed." -ForegroundColor Green
