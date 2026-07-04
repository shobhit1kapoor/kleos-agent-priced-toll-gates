param(
  [string]$Address = "0x3a074d1050340eea8022df3359bc517431303e58",

  [string]$BaseUrl = "http://127.0.0.1:3000",
  [string]$ItemId = "ci_arc_gateway_notes"
)

$ErrorActionPreference = "Stop"
$url = "$BaseUrl/api/content/$ItemId"

Write-Host "Inspecting x402 payment requirements for $url"
Write-Host "No payment will be made because --estimate is used."

circle services pay $url `
  --address $Address `
  --chain ARC-TESTNET `
  --max-amount 0.05 `
  --estimate `
  --output json
