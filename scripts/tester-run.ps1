param(
  [string]$BaseUrl = "https://kleos-agent-priced-toll-gates.vercel.app",
  [string]$TesterName = "Kleos tester",
  [ValidateSet("builder", "creator", "publisher", "agent-operator", "judge", "other")]
  [string]$Role = "builder",
  [string]$Quote = "I ran the Kleos settlement flow and could inspect the proof trail.",
  [string]$Contact = "",
  [switch]$OpenIssue
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Invoke-JsonPost($Uri, $Body) {
  Invoke-RestMethod `
    -Uri $Uri `
    -Method Post `
    -ContentType "application/json" `
    -Body ($Body | ConvertTo-Json -Depth 8)
}

Write-Step "Kleos tester runner"
Write-Host "Target: $BaseUrl"
Write-Host "Tester: $TesterName ($Role)"

Write-Step "Check public app"
$health = Invoke-RestMethod "$BaseUrl/api/health"
if (-not $health.ok) {
  throw "Kleos health check did not return ok=true."
}
Write-Host "Health: $($health.status)"

Write-Step "Inspect proof surfaces"
$proofPack = Invoke-RestMethod "$BaseUrl/api/proof-pack"
if ($proofPack.strongestDifferentiators.Count -lt 10) {
  throw "Proof pack looks incomplete."
}
$certificate = Invoke-RestMethod "$BaseUrl/api/submission/certificate"
if (-not $certificate.circleArcProof.liveX402Receipt.receiptId) {
  throw "Submission certificate is missing the live x402 receipt."
}
Write-Host "Proof pack differentiators: $($proofPack.strongestDifferentiators.Count)"
Write-Host "Live x402 receipt: $($certificate.circleArcProof.liveX402Receipt.receiptId)"

Write-Step "Run no-wallet settlement scenario"
$trial = Invoke-JsonPost "$BaseUrl/api/trial/sponsored" @{
  tester = $TesterName
  role = $Role
}
$citationReceipts = @($trial.citations.citationReceipts)
if ($citationReceipts.Count -lt 1) {
  throw "Sponsored trial did not create citation receipts."
}
Write-Host "Trial mode: $($trial.trial.mode)"
Write-Host "Citation receipts: $($citationReceipts.Count)"

Write-Step "Verify latest receipt"
$verification = Invoke-RestMethod "$BaseUrl/api/receipts/verify?latest=true"
if (-not $verification.verification.status) {
  throw "Receipt verifier did not return a status."
}
Write-Host "Receipt verification: $($verification.verification.status)"

Write-Step "Mint tester attestation"
$attestationPayload = @{
  testerName = $TesterName
  testerRole = $Role
  scenarioRun = $true
  useful = $true
  quote = $Quote
  walletOrContact = if ($Contact.Trim()) { $Contact.Trim() } else { $null }
  liveUrl = $BaseUrl
}
$attestation = Invoke-JsonPost "$BaseUrl/api/traction/attest" $attestationPayload
if (-not $attestation.attestation.proofHash -or -not $attestation.attestation.githubIssueUrl) {
  throw "Attestation did not return a proof hash and GitHub issue URL."
}

Write-Host ""
Write-Host "Proof hash:" -ForegroundColor Green
Write-Host $attestation.attestation.proofHash
Write-Host ""
Write-Host "Open this GitHub issue URL and submit it publicly:" -ForegroundColor Green
Write-Host $attestation.attestation.githubIssueUrl
Write-Host ""
Write-Host "After submitting, verify durable traction here:"
Write-Host "$BaseUrl/api/traction/github"
Write-Output "KLEOS_PROOF_HASH=$($attestation.attestation.proofHash)"
Write-Output "KLEOS_GITHUB_ISSUE_URL=$($attestation.attestation.githubIssueUrl)"

if ($OpenIssue) {
  Start-Process $attestation.attestation.githubIssueUrl
}
