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
Write-Host "Score honesty checked: $($positioning.rubricScoreEstimate.total)/100."

Write-Step "Proof surface invariants"
$proofPack = Invoke-RestMethod "$BaseUrl/api/proof-pack"
Assert-True ($proofPack.strongestDifferentiators.Count -ge 16) "Proof pack is missing differentiators."
Assert-True ($proofPack.apiSurfaces -contains "POST /api/a2a/ask") "Proof pack missing A2A surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /api/registry/sources") "Proof pack missing registry surface."
Assert-True ($proofPack.apiSurfaces -contains "GET /api/vault/:id") "Proof pack missing vault surface."
Write-Host "Proof pack surfaces checked."

Write-Host ""
Write-Host "Kleos invariant check passed." -ForegroundColor Green
